package com.library.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.library.dto.OfferRequestDTO;
import com.library.dto.OfferResponseDTO;
import com.library.enums.OfferType;
import com.library.exception.ResourceNotFoundException;
import com.library.model.Communities;
import com.library.model.Offers;
import com.library.repository.CommunitiesRepository;
import com.library.repository.OffersRepository;

@Service
public class OffersService {

    private final OffersRepository offersRepository;
    private final CommunitiesRepository communitiesRepository;

    public OffersService(OffersRepository offersRepository, CommunitiesRepository communitiesRepository) {
        this.offersRepository = offersRepository;
        this.communitiesRepository = communitiesRepository;
    }

    public List<OfferResponseDTO> getAllOffers() {
        return offersRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public OfferResponseDTO getOfferById(Long offerId) {
        return convertToDto(findOffer(offerId));
    }

    public List<OfferResponseDTO> getOffersByCommunity(Long communityId) {
        return offersRepository.findByCommunityCommunityIdOrderByStartDateDesc(communityId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public Optional<OfferResponseDTO> getActiveOfferForCommunity(Long communityId, LocalDate date) {
        LocalDate effectiveDate = date == null ? LocalDate.now() : date;
        return offersRepository
                .findFirstByCommunityCommunityIdAndActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        communityId,
                        effectiveDate,
                        effectiveDate
                )
                .map(this::convertToDto);
    }

    @Transactional
    public OfferResponseDTO createOffer(OfferRequestDTO request) {
        Offers offer = new Offers();
        applyRequest(offer, request);
        boolean requestedActive = offer.isActive();
        if (requestedActive) {
            offer.setActive(false);
        }
        Offers savedOffer = offersRepository.save(offer);

        if (requestedActive) {
            activateOffer(savedOffer.getOfferId());
            return getOfferById(savedOffer.getOfferId());
        }

        return convertToDto(savedOffer);
    }

    @Transactional
    public OfferResponseDTO updateOffer(Long offerId, OfferRequestDTO request) {
        Offers offer = findOffer(offerId);
        Long previousCommunityId = offer.getCommunity() == null ? null : offer.getCommunity().getCommunityId();
        boolean wasActive = offer.isActive();
        applyRequest(offer, request);
        Long currentCommunityId = offer.getCommunity() == null ? null : offer.getCommunity().getCommunityId();
        boolean requestedActive = offer.isActive();
        if (requestedActive) {
            offer.setActive(false);
        }
        Offers savedOffer = offersRepository.save(offer);

        if (wasActive && previousCommunityId != null && !previousCommunityId.equals(currentCommunityId)) {
            clearCommunityOfferIfNeeded(previousCommunityId, savedOffer.getOfferId());
        }

        if (requestedActive) {
            activateOffer(savedOffer.getOfferId());
            return getOfferById(savedOffer.getOfferId());
        }

        clearCommunityOfferIfNeeded(savedOffer);
        return convertToDto(savedOffer);
    }

    @Transactional
    public OfferResponseDTO activateOffer(Long offerId) {
        Offers offer = findOffer(offerId);
        Long communityId = offer.getCommunity().getCommunityId();

        List<Offers> activeOffers = offersRepository.findByCommunityCommunityIdAndActiveTrue(communityId);
        for (Offers activeOffer : activeOffers) {
            if (!activeOffer.getOfferId().equals(offerId)) {
                activeOffer.setActive(false);
            }
        }

        offersRepository.saveAll(activeOffers);
        offersRepository.flush();
        offer.setActive(true);
        Offers savedOffer = offersRepository.save(offer);

        Communities community = offer.getCommunity();
        community.setActiveOfferId(savedOffer.getOfferId());
        community.setOfferActive(true);
        communitiesRepository.save(community);

        return convertToDto(savedOffer);
    }

    @Transactional
    public OfferResponseDTO deactivateOffer(Long offerId) {
        Offers offer = findOffer(offerId);
        offer.setActive(false);
        Offers savedOffer = offersRepository.save(offer);
        clearCommunityOfferIfNeeded(savedOffer);
        return convertToDto(savedOffer);
    }

    private Offers findOffer(Long offerId) {
        return offersRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found with id: " + offerId));
    }

    private void applyRequest(Offers offer, OfferRequestDTO request) {
        Communities community = communitiesRepository.findById(request.getCommunityId())
                .orElseThrow(() -> new ResourceNotFoundException("Community not found with id: " + request.getCommunityId()));

        OfferType offerType = parseOfferType(request.getOfferType());

        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new IllegalArgumentException("Offer start date and end date are required.");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("Offer end date cannot be before start date.");
        }
        if (offerType == OfferType.PERCENT && request.getDiscountPercent() == null) {
            throw new IllegalArgumentException("Discount percent is required for percentage offers.");
        }
        if (offerType == OfferType.BUNDLE &&
                (request.getBundleBookCount() == null || request.getBundlePrice() == null || request.getBundleDurationDays() == null)) {
            throw new IllegalArgumentException("Book count, bundle price, and duration are required for bundle offers.");
        }

        offer.setOfferName(request.getOfferName());
        offer.setCommunity(community);
        offer.setOfferType(offerType);
        offer.setStartDate(request.getStartDate());
        offer.setEndDate(request.getEndDate());
        offer.setDiscountPercent(request.getDiscountPercent());
        offer.setBundleBookCount(request.getBundleBookCount());
        offer.setBundlePrice(request.getBundlePrice());
        offer.setBundleDurationDays(request.getBundleDurationDays());
        offer.setActive(request.isActive());
    }

    private OfferType parseOfferType(String offerType) {
        if (offerType == null) {
            throw new IllegalArgumentException("Offer type is required.");
        }
        try {
            return OfferType.valueOf(offerType.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Offer type must be BUNDLE or PERCENT.");
        }
    }

    private void clearCommunityOfferIfNeeded(Offers offer) {
        Communities community = offer.getCommunity();
        if (community == null) {
            return;
        }

        clearCommunityOfferIfNeeded(community.getCommunityId(), offer.getOfferId());
    }

    private void clearCommunityOfferIfNeeded(Long communityId, Long offerId) {
        if (communityId == null || offerId == null) {
            return;
        }

        Communities community = communitiesRepository.findById(communityId)
                .orElse(null);
        if (community != null && offerId.equals(community.getActiveOfferId())) {
            community.setActiveOfferId(null);
            community.setOfferActive(false);
            communitiesRepository.save(community);
        }
    }

    private OfferResponseDTO convertToDto(Offers offer) {
        OfferResponseDTO dto = new OfferResponseDTO();
        dto.setOfferId(offer.getOfferId());
        dto.setOfferName(offer.getOfferName());
        dto.setOfferType(offer.getOfferType() == null ? null : offer.getOfferType().name());
        dto.setStartDate(offer.getStartDate());
        dto.setEndDate(offer.getEndDate());
        dto.setDiscountPercent(offer.getDiscountPercent());
        dto.setBundleBookCount(offer.getBundleBookCount());
        dto.setBundlePrice(offer.getBundlePrice());
        dto.setBundleDurationDays(offer.getBundleDurationDays());
        dto.setActive(offer.isActive());

        if (offer.getCommunity() != null) {
            dto.setCommunityId(offer.getCommunity().getCommunityId());
            dto.setCommunityName(offer.getCommunity().getCommunityName());
        }

        return dto;
    }
}
