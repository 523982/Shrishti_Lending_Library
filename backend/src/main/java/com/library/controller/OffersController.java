package com.library.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.library.dto.OfferRequestDTO;
import com.library.dto.OfferResponseDTO;
import com.library.service.OffersService;

@RestController
@RequestMapping("/api/offers")
public class OffersController {

    private final OffersService offersService;

    public OffersController(OffersService offersService) {
        this.offersService = offersService;
    }

    @GetMapping
    public List<OfferResponseDTO> getAllOffers() {
        return offersService.getAllOffers();
    }

    @GetMapping("/{id}")
    public OfferResponseDTO getOfferById(@PathVariable("id") Long offerId) {
        return offersService.getOfferById(offerId);
    }

    @GetMapping("/community/{communityId}")
    public List<OfferResponseDTO> getOffersByCommunity(@PathVariable Long communityId) {
        return offersService.getOffersByCommunity(communityId);
    }

    @GetMapping("/community/{communityId}/active")
    public ResponseEntity<OfferResponseDTO> getActiveOfferForCommunity(
            @PathVariable Long communityId,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return offersService.getActiveOfferForCommunity(communityId, date)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping
    public OfferResponseDTO createOffer(@RequestBody OfferRequestDTO request) {
        return offersService.createOffer(request);
    }

    @PutMapping("/{id}")
    public OfferResponseDTO updateOffer(@PathVariable("id") Long offerId, @RequestBody OfferRequestDTO request) {
        return offersService.updateOffer(offerId, request);
    }

    @PutMapping("/{id}/activate")
    public OfferResponseDTO activateOffer(@PathVariable("id") Long offerId) {
        return offersService.activateOffer(offerId);
    }

    @PutMapping("/{id}/deactivate")
    public OfferResponseDTO deactivateOffer(@PathVariable("id") Long offerId) {
        return offersService.deactivateOffer(offerId);
    }
}
