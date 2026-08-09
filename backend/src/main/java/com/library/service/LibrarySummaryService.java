package com.library.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.library.dto.BookSummaryDTO;
import com.library.dto.CommunitySummaryDTO;
import com.library.dto.CustomerSummaryDTO;
import com.library.dto.OfferResponseDTO;
import com.library.dto.SummaryTransactionDTO;
import com.library.dto.SubscriptionStatusDTO;
import com.library.exception.ResourceNotFoundException;
import com.library.model.Books;
import com.library.model.Communities;
import com.library.model.Customers;
import com.library.model.Offers;
import com.library.model.Transactions;
import com.library.repository.BooksRepository;
import com.library.repository.CommunitiesRepository;
import com.library.repository.CustomersRepository;
import com.library.repository.OffersRepository;
import com.library.repository.TransactionsRepository;

@Service
public class LibrarySummaryService {

    private static final String SUBSCRIPTION_ACTIVE = "ACTIVE";
    private static final String SUBSCRIPTION_CLOSED = "CLOSED";
    private static final String SUBSCRIPTION_EXPIRED = "EXPIRED";

    private final BooksRepository booksRepository;
    private final CommunitiesRepository communitiesRepository;
    private final CustomersRepository customersRepository;
    private final OffersRepository offersRepository;
    private final TransactionsRepository transactionsRepository;

    public LibrarySummaryService(
            BooksRepository booksRepository,
            CommunitiesRepository communitiesRepository,
            CustomersRepository customersRepository,
            OffersRepository offersRepository,
            TransactionsRepository transactionsRepository
    ) {
        this.booksRepository = booksRepository;
        this.communitiesRepository = communitiesRepository;
        this.customersRepository = customersRepository;
        this.offersRepository = offersRepository;
        this.transactionsRepository = transactionsRepository;
    }

    @Transactional(readOnly = true)
    public CustomerSummaryDTO getCustomerSummary(String customerId) {
        Customers customer = customersRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
        List<Transactions> transactions = transactionsRepository
                .findByCustomersCustomerIdOrderByPickupDateDescTransactionIdDesc(customerId);

        CustomerSummaryDTO dto = new CustomerSummaryDTO();
        dto.setCustomerId(customer.getCustomerId());
        dto.setCustomerName(customer.getCustomerName());
        dto.setBlockNumber(customer.getBlockNumber());
        dto.setUnitNumber(customer.getUnitNumber());
        dto.setMobileNumber(customer.getMobileNumber());
        if (customer.getCommunity() != null) {
            dto.setCommunityId(customer.getCommunity().getCommunityId());
            dto.setCommunityName(customer.getCommunity().getCommunityName());
        }

        List<SummaryTransactionDTO> rows = transactions.stream()
                .map(this::toTransactionDto)
                .collect(Collectors.toList());
        dto.setHistory(rows);
        dto.setActiveBooks(rows.stream()
                .filter(SummaryTransactionDTO::isActive)
                .collect(Collectors.toList()));
        dto.setActiveBookCount(dto.getActiveBooks().size());
        dto.setTotalTransactions(rows.size());
        dto.setActiveSubscription(buildActiveSubscriptionStatus(customerId));
        applyCustomerTotals(dto, rows);
        return dto;
    }

    @Transactional(readOnly = true)
    public CommunitySummaryDTO getCommunitySummary(Long communityId) {
        Communities community = communitiesRepository.findById(communityId)
                .orElseThrow(() -> new ResourceNotFoundException("Community not found with id: " + communityId));
        List<Transactions> transactions = transactionsRepository
                .findByCustomersCommunityCommunityIdOrderByPickupDateDescTransactionIdDesc(communityId);

        CommunitySummaryDTO dto = new CommunitySummaryDTO();
        dto.setCommunityId(community.getCommunityId());
        dto.setCommunityName(community.getCommunityName());
        dto.setActiveOfferId(community.getActiveOfferId());
        dto.setOfferActive(community.isOfferActive());
        dto.setCustomerCount((int) customersRepository.countByCommunityCommunityId(communityId));
        dto.setActiveOffer(findCommunityOffer(community));

        List<SummaryTransactionDTO> rows = transactions.stream()
                .map(this::toTransactionDto)
                .collect(Collectors.toList());
        dto.setHistory(rows);
        dto.setActiveBooks(rows.stream()
                .filter(SummaryTransactionDTO::isActive)
                .collect(Collectors.toList()));
        dto.setActiveLendingCount(dto.getActiveBooks().size());
        dto.setTotalTransactions(rows.size());
        applyCommunityTotals(dto, rows);
        return dto;
    }

    @Transactional(readOnly = true)
    public BookSummaryDTO getBookSummary(Long bookId) {
        Books book = booksRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));
        List<Transactions> transactions = transactionsRepository
                .findByBooksBookIdOrderByPickupDateDescTransactionIdDesc(bookId);

        BookSummaryDTO dto = new BookSummaryDTO();
        dto.setBookId(book.getBookId());
        dto.setBookName(book.getBookName());
        dto.setAuthor(book.getAuthor());
        dto.setGenre(book.getGenre());
        dto.setImageUrl(book.getImageUrl());
        dto.setLendingCost(book.getLendingCost());
        dto.setPurchasePrice(book.getPurchasePrice());
        dto.setPurchaseDate(book.getPurchaseDate());
        if (book.getBookStatus() != null) {
            dto.setStatusId(book.getBookStatus().getStatusId());
            dto.setStatusDesc(String.valueOf(book.getBookStatus().getStatusDesc()));
        }

        List<SummaryTransactionDTO> rows = transactions.stream()
                .map(this::toTransactionDto)
                .collect(Collectors.toList());
        dto.setHistory(rows);
        dto.setActiveTransaction(rows.stream()
                .filter(SummaryTransactionDTO::isActive)
                .findFirst()
                .orElse(null));
        dto.setTimesLent(rows.size());
        applyBookTotals(dto, rows, book.getPurchasePrice());
        return dto;
    }

    private SummaryTransactionDTO toTransactionDto(Transactions transaction) {
        SummaryTransactionDTO dto = new SummaryTransactionDTO();
        dto.setTransactionId(transaction.getTransactionId());
        dto.setPickupDate(transaction.getPickupDate());
        dto.setReturnDate(transaction.getReturnDate());
        dto.setTotalAmount(money(transaction.getTotalAmount()));
        dto.setAmountPaid(money(transaction.getAmountPaid()));
        dto.setPendingAmount(pending(transaction));
        dto.setNormalAmount(money(transaction.getNormalAmount()));
        dto.setDiscountAmount(money(transaction.getDiscountAmount()));
        dto.setBookRevenueAmount(bookRevenue(transaction));
        dto.setSubscriptionTxnId(transaction.getSubscriptionTxnId());
        dto.setBundleBookNo(transaction.getBundleBookNo());
        dto.setBundleBookLimit(transaction.getBundleBookLimit());
        dto.setSubscriptionStatus(transaction.getSubscriptionStatus());
        dto.setActive(transaction.getReturnDate() == null);

        Customers customer = transaction.getCustomers();
        if (customer != null) {
            dto.setCustomerId(customer.getCustomerId());
            dto.setCustomerName(customer.getCustomerName());
            dto.setMobileNumber(customer.getMobileNumber());
            if (customer.getCommunity() != null) {
                dto.setCommunityId(customer.getCommunity().getCommunityId());
                dto.setCommunityName(customer.getCommunity().getCommunityName());
            }
        }

        Books book = transaction.getBooks();
        if (book != null) {
            dto.setBookId(book.getBookId());
            dto.setBookName(book.getBookName());
            dto.setAuthor(book.getAuthor());
            dto.setGenre(book.getGenre());
        }

        Offers offer = transaction.getOffer();
        if (offer != null) {
            dto.setOfferId(offer.getOfferId());
            dto.setOfferName(offer.getOfferName());
            dto.setOfferType(offer.getOfferType() == null ? null : offer.getOfferType().name());
        }

        return dto;
    }

    private SubscriptionStatusDTO buildActiveSubscriptionStatus(String customerId) {
        Map<String, List<Transactions>> rowsBySubscription = transactionsRepository
                .findPotentialActiveSubscriptionRows(customerId, SUBSCRIPTION_ACTIVE)
                .stream()
                .filter(transaction -> transaction.getSubscriptionTxnId() != null)
                .collect(Collectors.groupingBy(Transactions::getSubscriptionTxnId));

        for (List<Transactions> rows : rowsBySubscription.values()) {
            SubscriptionStatusDTO status = buildSubscriptionStatus(rows);
            if (status.isHasActiveSubscription()) {
                return status;
            }
        }

        SubscriptionStatusDTO dto = new SubscriptionStatusDTO();
        dto.setHasActiveSubscription(false);
        dto.setCanUseSubscription(false);
        return dto;
    }

    private SubscriptionStatusDTO buildSubscriptionStatus(List<Transactions> rows) {
        String subscriptionTxnId = rows.get(0).getSubscriptionTxnId();
        List<Transactions> subscriptionRows = transactionsRepository.findBySubscriptionTxnIdOrderByBundleBookNoAsc(subscriptionTxnId);
        if (subscriptionRows.isEmpty()) {
            subscriptionRows = rows;
        }

        Transactions parent = getParentSubscriptionTransaction(subscriptionRows, subscriptionTxnId);
        int booksUsed = subscriptionRows.size();
        int booksReturned = (int) subscriptionRows.stream()
                .filter(transaction -> transaction.getReturnDate() != null)
                .count();
        int openBooks = booksUsed - booksReturned;
        int limit = parent.getBundleBookLimit() == null ? booksUsed : parent.getBundleBookLimit();
        boolean allReturned = booksReturned == booksUsed;
        boolean expired = parent.getSubscriptionEndDate() != null && LocalDate.now().isAfter(parent.getSubscriptionEndDate());
        boolean closed = booksUsed >= limit && allReturned;

        SubscriptionStatusDTO dto = new SubscriptionStatusDTO();
        dto.setHasActiveSubscription(!expired && !closed);
        dto.setCanUseSubscription(!expired && !closed && booksUsed < limit);
        dto.setSubscriptionTxnId(subscriptionTxnId);
        dto.setBooksUsed(booksUsed);
        dto.setBooksReturned(booksReturned);
        dto.setOpenBooks(openBooks);
        dto.setBundleBookLimit(limit);
        dto.setAmountPaid(subscriptionRows.stream()
                .map(Transactions::getAmountPaid)
                .map(this::money)
                .reduce(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), BigDecimal::add));
        dto.setBookRevenueAmount(bookRevenue(parent));
        dto.setSubscriptionStatus(expired ? SUBSCRIPTION_EXPIRED : closed ? SUBSCRIPTION_CLOSED : SUBSCRIPTION_ACTIVE);
        dto.setSubscriptionStartDate(parent.getSubscriptionStartDate());
        dto.setSubscriptionEndDate(parent.getSubscriptionEndDate());

        if (parent.getOffer() != null) {
            dto.setOfferId(parent.getOffer().getOfferId());
            dto.setOfferName(parent.getOffer().getOfferName());
        }

        return dto;
    }

    private Transactions getParentSubscriptionTransaction(List<Transactions> rows, String subscriptionTxnId) {
        return rows.stream()
                .filter(transaction -> subscriptionTxnId.equals(transaction.getTransactionId()))
                .findFirst()
                .orElseGet(() -> rows.stream()
                        .min(Comparator.comparing(transaction -> transaction.getBundleBookNo() == null ? 0 : transaction.getBundleBookNo()))
                        .orElse(rows.get(0)));
    }

    private OfferResponseDTO findCommunityOffer(Communities community) {
        Optional<Offers> activeOffer = Optional.empty();
        if (community.getActiveOfferId() != null) {
            activeOffer = offersRepository.findById(community.getActiveOfferId())
                    .filter(this::isEffectiveOffer);
        }
        if (activeOffer.isEmpty()) {
            activeOffer = offersRepository
                    .findFirstByCommunityCommunityIdAndActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                            community.getCommunityId(),
                            LocalDate.now(),
                            LocalDate.now()
                    );
        }
        return activeOffer.map(this::toOfferDto).orElse(null);
    }

    private boolean isEffectiveOffer(Offers offer) {
        LocalDate today = LocalDate.now();
        return offer.isActive()
                && !today.isBefore(offer.getStartDate())
                && !today.isAfter(offer.getEndDate());
    }

    private OfferResponseDTO toOfferDto(Offers offer) {
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

    private void applyCustomerTotals(CustomerSummaryDTO dto, List<SummaryTransactionDTO> rows) {
        dto.setTotalBilled(sum(rows, SummaryTransactionDTO::getTotalAmount));
        dto.setTotalCollected(sum(rows, SummaryTransactionDTO::getAmountPaid));
        dto.setTotalPending(sum(rows, SummaryTransactionDTO::getPendingAmount));
        dto.setTotalBookRevenue(sum(rows, SummaryTransactionDTO::getBookRevenueAmount));
    }

    private void applyCommunityTotals(CommunitySummaryDTO dto, List<SummaryTransactionDTO> rows) {
        dto.setTotalBilled(sum(rows, SummaryTransactionDTO::getTotalAmount));
        dto.setTotalCollected(sum(rows, SummaryTransactionDTO::getAmountPaid));
        dto.setTotalPending(sum(rows, SummaryTransactionDTO::getPendingAmount));
        dto.setTotalBookRevenue(sum(rows, SummaryTransactionDTO::getBookRevenueAmount));
    }

    private void applyBookTotals(BookSummaryDTO dto, List<SummaryTransactionDTO> rows, BigDecimal purchasePrice) {
        dto.setTotalBilled(sum(rows, SummaryTransactionDTO::getTotalAmount));
        dto.setTotalCollected(sum(rows, SummaryTransactionDTO::getAmountPaid));
        dto.setTotalPending(sum(rows, SummaryTransactionDTO::getPendingAmount));
        dto.setTotalBookRevenue(sum(rows, SummaryTransactionDTO::getBookRevenueAmount));
        dto.setEstimatedProfit(money(dto.getTotalBookRevenue().subtract(money(purchasePrice))));
    }

    private BigDecimal sum(List<SummaryTransactionDTO> rows, java.util.function.Function<SummaryTransactionDTO, BigDecimal> getter) {
        return rows.stream()
                .map(getter)
                .map(this::money)
                .reduce(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), BigDecimal::add);
    }

    private BigDecimal pending(Transactions transaction) {
        return money(transaction.getTotalAmount()).subtract(money(transaction.getAmountPaid())).max(BigDecimal.ZERO);
    }

    private BigDecimal bookRevenue(Transactions transaction) {
        return transaction.getBookRevenueAmount() == null
                ? money(transaction.getTotalAmount())
                : money(transaction.getBookRevenueAmount());
    }

    private BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : value.setScale(2, RoundingMode.HALF_UP);
    }
}
