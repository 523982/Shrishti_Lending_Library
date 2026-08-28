package com.library.service;

import com.library.dto.LendRequestDTO;
import com.library.dto.ReturnRequestDTO;
import com.library.dto.SubscriptionStatusDTO;
import com.library.dto.TransactionResponseDTO;
import com.library.enums.BookStatusEnum;
import com.library.enums.OfferType;
import com.library.exception.ResourceNotFoundException;
import com.library.model.BookStatus;
import com.library.model.Books;
import com.library.model.Customers;
import com.library.model.Offers;
import com.library.model.Transactions;
import com.library.repository.BooksRepository;
import com.library.repository.BooksStatusRepository;
import com.library.repository.CustomersRepository;
import com.library.repository.OffersRepository;
import com.library.repository.TransactionsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.lang.String;

@Service
public class TransactionsService {

	public TransactionsService(TransactionsRepository transactionsRepository, BooksRepository booksRepository,
			CustomersRepository customersRepository, BooksStatusRepository booksStatusRepository,
			OffersRepository offersRepository) {
		super();
		this.transactionsRepository = transactionsRepository;
		this.booksRepository = booksRepository;
		this.customersRepository = customersRepository;
		this.booksStatusRepository=booksStatusRepository;
		this.offersRepository = offersRepository;
	}

	private final TransactionsRepository transactionsRepository;
	private final BooksRepository booksRepository;
	private final BooksStatusRepository booksStatusRepository;
	private final CustomersRepository customersRepository;
	private final OffersRepository offersRepository;
	private static final String SUBSCRIPTION_ACTIVE = "ACTIVE";
	private static final String SUBSCRIPTION_CLOSED = "CLOSED";
	private static final String SUBSCRIPTION_EXPIRED = "EXPIRED";

	public List<TransactionResponseDTO> getAllTransactions() {
		return transactionsRepository.findAll().stream().map(this::convertToDto).collect(Collectors.toList());
	}


		public List<TransactionResponseDTO> findLast5Txns() { 
			return
			transactionsRepository.findLast5Txns().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
		}


	private String generateNextTransactionId() {
		// Find the highest number, default to 0 if no transactions exist, then add 1.
		int nextNumber = transactionsRepository.findMaxTransactionNumber().orElse(0) + 1;
		return String.format("TXN%04d", nextNumber);
	}

	public SubscriptionStatusDTO getActiveSubscriptionForCustomer(String customerId) {
		List<Transactions> activeRows = getActiveSubscriptionRows(customerId, LocalDate.now());
		if (activeRows.isEmpty()) {
			SubscriptionStatusDTO dto = new SubscriptionStatusDTO();
			dto.setHasActiveSubscription(false);
			dto.setCanUseSubscription(false);
			return dto;
		}

		return buildSubscriptionStatus(activeRows);
	}

	@Transactional
	public Transactions lendBook(LendRequestDTO lendRequest) {
		Books book = booksRepository.findById(lendRequest.getBookId())
				.orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + lendRequest.getBookId()));
	    BookStatus availableStatus = getOrCreateBookStatus(1L, BookStatusEnum.AVAILABLE);
	    BookStatus unavailableStatus = getOrCreateBookStatus(2L, BookStatusEnum.UNAVAILABLE);

		if (book.getBookStatus() == null || !availableStatus.getStatusId().equals(book.getBookStatus().getStatusId())) {
			throw new IllegalStateException("Book is not available for lending.");
		}

		Customers customer = customersRepository.findById(lendRequest.getCustomerId()).orElseThrow(
				() -> new ResourceNotFoundException("Customer not found with id: " + lendRequest.getCustomerId()));

		LocalDate pickupDate = lendRequest.getPickupDate() != null ? lendRequest.getPickupDate() : LocalDate.now();
		String transactionId = generateNextTransactionId();
		Transactions transaction = new Transactions();
		transaction.setTransactionId(transactionId);
		transaction.setBooks(book);
		transaction.setCustomers(customer);
		transaction.setPickupDate(pickupDate);
		transaction.setSwap(lendRequest.isSwap());

		// Update book status
		book.setBookStatus(unavailableStatus);
		booksRepository.save(book);

		boolean usingExistingSubscription = lendRequest.getSubscriptionTxnId() != null && !lendRequest.getSubscriptionTxnId().isBlank();
		List<Transactions> activeSubscriptionRows = usingExistingSubscription
				? List.of()
				: getActiveSubscriptionRows(customer.getCustomerId(), pickupDate);

		if (!usingExistingSubscription && !activeSubscriptionRows.isEmpty()) {
			throw new IllegalStateException("Customer has an active subscription. Use Active Subscription for the next book.");
		}

		if (usingExistingSubscription) {
			applyExistingSubscription(transaction, lendRequest.getSubscriptionTxnId(), customer, book, pickupDate);
		} else if (lendRequest.getOfferId() != null) {
			Offers offer = getValidOffer(lendRequest.getOfferId(), customer, pickupDate);

			if (offer.getOfferType() == OfferType.BUNDLE) {
				startSubscription(transaction, offer, book, pickupDate);
			} else {
				applyPercentOffer(transaction, lendRequest, offer, book);
			}
		} else {
			applyNormalLending(transaction, lendRequest, book);
		}

		return transactionsRepository.save(transaction);
	}
	
	public List<TransactionResponseDTO> lentBooks(Long bookId) {
		return transactionsRepository.findLentBooks(bookId).stream()
	            .map(this::convertToDto)
	            .collect(Collectors.toList());
	}

	@Transactional
	public TransactionResponseDTO returnBook(Long bookId, ReturnRequestDTO returnRequest) {
		// public TransactionResponseDTO returnBook(String transactionId) {
		// Transactions transactions = transactionsRepository.findById(transactionId)
		BookStatus availableStatus = getOrCreateBookStatus(1L, BookStatusEnum.AVAILABLE);
		String txnId = transactionsRepository.findTxnId(bookId).orElseThrow(
				() -> new ResourceNotFoundException("Book not found or is already lent with id: " + bookId));
		Transactions transactions = transactionsRepository.findById(txnId)
				.orElseThrow(() -> new ResourceNotFoundException("Txn not found with id: " + txnId));

		if (transactions.getReturnDate() != null) {
			throw new IllegalStateException("This book has already been returned.");
		}

		LocalDate returnDate = returnRequest != null && returnRequest.getReturnDate() != null
				? returnRequest.getReturnDate()
				: LocalDate.now();
		if (returnDate.isBefore(transactions.getPickupDate())) {
			throw new IllegalArgumentException("Return date cannot be before lend date.");
		}

		boolean isSwap = returnRequest != null ? returnRequest.isSwap() : transactions.isSwap();

		transactions.setReturnDate(returnDate);
		transactions.setSwap(isSwap);
		if (transactions.getSubscriptionTxnId() == null) {
			long days = ChronoUnit.DAYS.between(transactions.getPickupDate(), returnDate);
			long weeks = Math.max(1L, (days + 6L) / 7L);
			BigDecimal normalAmount = money(transactions.getBooks().getLendingCost().multiply(BigDecimal.valueOf(weeks)));
			if (isSwap) {
				normalAmount = money(normalAmount.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP));
			}

			BigDecimal finalAmount = normalAmount;
			BigDecimal discountAmount = BigDecimal.ZERO;
			if (transactions.getOffer() != null && transactions.getOffer().getOfferType() == OfferType.PERCENT) {
				discountAmount = calculatePercentDiscount(normalAmount, transactions.getOffer());
				finalAmount = money(normalAmount.subtract(discountAmount));
			}

			transactions.setNormalAmount(normalAmount);
			transactions.setDiscountAmount(discountAmount);
			transactions.setTotalAmount(finalAmount);
			transactions.setBookRevenueAmount(finalAmount);
			BigDecimal paidAmount = money(transactions.getAmountPaid());
			if (returnRequest != null && returnRequest.getAmountPaid() != null) {
				BigDecimal returnPayment = getCollectedAmount(returnRequest.getAmountPaid(), "Payment amount cannot be negative.");
				paidAmount = money(paidAmount.add(returnPayment));
				if (paidAmount.compareTo(finalAmount) > 0) {
					paidAmount = finalAmount;
				}
			} else if (!transactions.isPartiallyPaid()) {
				paidAmount = finalAmount;
			}
			transactions.setAmountPaid(paidAmount);
			transactions.setPartiallyPaid(paidAmount.compareTo(finalAmount) < 0);
		}

		Books books = transactions.getBooks();
		books.setBookStatus(availableStatus);
		booksRepository.save(books);

		Transactions savedTransaction = transactionsRepository.save(transactions);
		if (savedTransaction.getSubscriptionTxnId() != null) {
			refreshSubscriptionStatus(savedTransaction.getSubscriptionTxnId(), returnDate);
			savedTransaction = transactionsRepository.findById(savedTransaction.getTransactionId()).orElse(savedTransaction);
		}
		return convertToDto(savedTransaction);

	}

	private void applyNormalLending(Transactions transaction, LendRequestDTO lendRequest, Books book) {
		BigDecimal totalAmount = money(lendRequest.getTotalAmount() != null ? lendRequest.getTotalAmount() : book.getLendingCost());
		BigDecimal amountPaid = getCollectedAmount(lendRequest.getAmountPaid(), "Amount paid cannot be negative.");

		transaction.setTotalAmount(totalAmount);
		transaction.setNormalAmount(totalAmount);
		transaction.setDiscountAmount(BigDecimal.ZERO);
		transaction.setBookRevenueAmount(totalAmount);
		transaction.setPartiallyPaid(isPartiallyPaid(amountPaid, totalAmount));
		transaction.setAmountPaid(amountPaid);
	}

	private void applyPercentOffer(Transactions transaction, LendRequestDTO lendRequest, Offers offer, Books book) {
		BigDecimal normalAmount = money(lendRequest.getTotalAmount() != null ? lendRequest.getTotalAmount() : book.getLendingCost());
		BigDecimal discountAmount = calculatePercentDiscount(normalAmount, offer);
		BigDecimal finalAmount = money(normalAmount.subtract(discountAmount));
		BigDecimal amountPaid = getCollectedAmount(lendRequest.getAmountPaid(), "Amount paid cannot be negative.");

		transaction.setOffer(offer);
		transaction.setTotalAmount(finalAmount);
		transaction.setNormalAmount(normalAmount);
		transaction.setDiscountAmount(discountAmount);
		transaction.setBookRevenueAmount(finalAmount);
		transaction.setPartiallyPaid(isPartiallyPaid(amountPaid, finalAmount));
		transaction.setAmountPaid(amountPaid);
	}

	private BigDecimal getCollectedAmount(BigDecimal amount, String negativeMessage) {
		BigDecimal amountPaid = money(amount);
		if (amountPaid.compareTo(BigDecimal.ZERO) < 0) {
			throw new IllegalArgumentException(negativeMessage);
		}
		return amountPaid;
	}

	private boolean isPartiallyPaid(BigDecimal amountPaid, BigDecimal totalAmount) {
		return amountPaid.compareTo(BigDecimal.ZERO) > 0 && amountPaid.compareTo(totalAmount) < 0;
	}

	private void startSubscription(Transactions transaction, Offers offer, Books book, LocalDate pickupDate) {
		validateBundleOffer(offer);
		BigDecimal bookRevenueAmount = calculateBundleBookRevenue(offer);

		transaction.setOffer(offer);
		transaction.setSubscriptionTxnId(transaction.getTransactionId());
		transaction.setBundleBookNo(1);
		transaction.setBundleBookLimit(offer.getBundleBookCount());
		transaction.setSubscriptionStatus(SUBSCRIPTION_ACTIVE);
		transaction.setSubscriptionStartDate(pickupDate);
		transaction.setSubscriptionEndDate(pickupDate.plusDays(offer.getBundleDurationDays()));
		transaction.setTotalAmount(money(offer.getBundlePrice()));
		transaction.setAmountPaid(money(offer.getBundlePrice()));
		transaction.setNormalAmount(money(book.getLendingCost()));
		transaction.setDiscountAmount(money(book.getLendingCost()).subtract(bookRevenueAmount).max(BigDecimal.ZERO));
		transaction.setBookRevenueAmount(bookRevenueAmount);
		transaction.setPartiallyPaid(false);
		transaction.setSwap(false);
	}

	private void applyExistingSubscription(Transactions transaction, String subscriptionTxnId, Customers customer, Books book, LocalDate pickupDate) {
		refreshSubscriptionStatus(subscriptionTxnId, pickupDate);
		List<Transactions> subscriptionRows = transactionsRepository.findBySubscriptionTxnIdOrderByBundleBookNoAsc(subscriptionTxnId);
		if (subscriptionRows.isEmpty()) {
			throw new ResourceNotFoundException("Subscription not found with id: " + subscriptionTxnId);
		}

		Transactions parent = getParentSubscriptionTransaction(subscriptionRows, subscriptionTxnId);
		if (!customer.getCustomerId().equals(parent.getCustomers().getCustomerId())) {
			throw new IllegalStateException("Subscription belongs to another customer.");
		}
		if (!SUBSCRIPTION_ACTIVE.equals(parent.getSubscriptionStatus())) {
			throw new IllegalStateException("Subscription is not active.");
		}
		if (parent.getSubscriptionEndDate() != null && pickupDate.isAfter(parent.getSubscriptionEndDate())) {
			refreshSubscriptionStatus(subscriptionTxnId, pickupDate);
			throw new IllegalStateException("Subscription has expired.");
		}

		int usedBooks = subscriptionRows.size();
		int limit = parent.getBundleBookLimit() == null ? usedBooks : parent.getBundleBookLimit();
		if (usedBooks >= limit) {
			throw new IllegalStateException("Subscription book limit is already used.");
		}

		BigDecimal bookRevenueAmount = parent.getBookRevenueAmount() != null
				? money(parent.getBookRevenueAmount())
				: calculateBundleBookRevenue(parent.getOffer());

		transaction.setOffer(parent.getOffer());
		transaction.setSubscriptionTxnId(subscriptionTxnId);
		transaction.setBundleBookNo(usedBooks + 1);
		transaction.setBundleBookLimit(limit);
		transaction.setSubscriptionStatus(SUBSCRIPTION_ACTIVE);
		transaction.setSubscriptionStartDate(parent.getSubscriptionStartDate());
		transaction.setSubscriptionEndDate(parent.getSubscriptionEndDate());
		transaction.setTotalAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
		transaction.setAmountPaid(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
		transaction.setNormalAmount(money(book.getLendingCost()));
		transaction.setDiscountAmount(money(book.getLendingCost()).subtract(bookRevenueAmount).max(BigDecimal.ZERO));
		transaction.setBookRevenueAmount(bookRevenueAmount);
		transaction.setPartiallyPaid(false);
		transaction.setSwap(false);
	}

	private Offers getValidOffer(Long offerId, Customers customer, LocalDate effectiveDate) {
		Offers offer = offersRepository.findById(offerId)
				.orElseThrow(() -> new ResourceNotFoundException("Offer not found with id: " + offerId));

		Long customerCommunityId = customer.getCommunity() == null ? null : customer.getCommunity().getCommunityId();
		Long offerCommunityId = offer.getCommunity() == null ? null : offer.getCommunity().getCommunityId();

		if (customerCommunityId == null || !customerCommunityId.equals(offerCommunityId)) {
			throw new IllegalStateException("Offer does not apply to the customer's community.");
		}
		if (!offer.isActive() || effectiveDate.isBefore(offer.getStartDate()) || effectiveDate.isAfter(offer.getEndDate())) {
			throw new IllegalStateException("Offer is not active for the selected lend date.");
		}

		return offer;
	}

	private void validateBundleOffer(Offers offer) {
		if (offer.getBundleBookCount() == null || offer.getBundleBookCount() <= 0) {
			throw new IllegalStateException("Bundle offer needs a valid book count.");
		}
		if (offer.getBundlePrice() == null || offer.getBundlePrice().compareTo(BigDecimal.ZERO) <= 0) {
			throw new IllegalStateException("Bundle offer needs a valid bundle price.");
		}
		if (offer.getBundleDurationDays() == null || offer.getBundleDurationDays() <= 0) {
			throw new IllegalStateException("Bundle offer needs a valid duration.");
		}
	}

	private BigDecimal calculateBundleBookRevenue(Offers offer) {
		validateBundleOffer(offer);
		return money(offer.getBundlePrice().divide(BigDecimal.valueOf(offer.getBundleBookCount()), 2, RoundingMode.HALF_UP));
	}

	private BigDecimal calculatePercentDiscount(BigDecimal amount, Offers offer) {
		BigDecimal percent = offer.getDiscountPercent() == null ? BigDecimal.ZERO : offer.getDiscountPercent();
		return money(amount.multiply(percent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
	}

	private BigDecimal money(BigDecimal value) {
		return value == null ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : value.setScale(2, RoundingMode.HALF_UP);
	}

	private List<Transactions> getActiveSubscriptionRows(String customerId, LocalDate effectiveDate) {
		List<Transactions> activeRows = transactionsRepository
				.findPotentialActiveSubscriptionRows(customerId, SUBSCRIPTION_ACTIVE)
				.stream()
				.filter(transaction -> transaction.getSubscriptionTxnId() != null)
				.collect(Collectors.toList());

		activeRows.stream()
				.map(Transactions::getSubscriptionTxnId)
				.distinct()
				.forEach(subscriptionTxnId -> refreshSubscriptionStatus(subscriptionTxnId, effectiveDate));

		return transactionsRepository.findByCustomersCustomerIdAndSubscriptionStatus(customerId, SUBSCRIPTION_ACTIVE)
				.stream()
				.filter(transaction -> transaction.getSubscriptionTxnId() != null)
				.collect(Collectors.toList());
	}

	private void refreshSubscriptionStatus(String subscriptionTxnId, LocalDate effectiveDate) {
		List<Transactions> subscriptionRows = transactionsRepository.findBySubscriptionTxnIdOrderByBundleBookNoAsc(subscriptionTxnId);
		if (subscriptionRows.isEmpty()) {
			return;
		}

		Transactions parent = getParentSubscriptionTransaction(subscriptionRows, subscriptionTxnId);
		int usedBooks = subscriptionRows.size();
		int limit = parent.getBundleBookLimit() == null ? usedBooks : parent.getBundleBookLimit();
		boolean allReturned = subscriptionRows.stream().allMatch(transaction -> transaction.getReturnDate() != null);
		LocalDate checkDate = effectiveDate == null ? LocalDate.now() : effectiveDate;
		String nextStatus = SUBSCRIPTION_ACTIVE;

		if (usedBooks >= limit && allReturned) {
			nextStatus = SUBSCRIPTION_CLOSED;
		} else if (parent.getSubscriptionEndDate() != null && checkDate.isAfter(parent.getSubscriptionEndDate())) {
			nextStatus = SUBSCRIPTION_EXPIRED;
		}

		final String status = nextStatus;
		boolean changed = subscriptionRows.stream()
				.anyMatch(transaction -> !status.equals(transaction.getSubscriptionStatus()));
		if (changed) {
			subscriptionRows.forEach(transaction -> transaction.setSubscriptionStatus(status));
			transactionsRepository.saveAll(subscriptionRows);
		}
	}

	private Transactions getParentSubscriptionTransaction(List<Transactions> subscriptionRows, String subscriptionTxnId) {
		return subscriptionRows.stream()
				.filter(transaction -> subscriptionTxnId.equals(transaction.getTransactionId()))
				.findFirst()
				.orElseGet(() -> subscriptionRows.stream()
						.min(Comparator.comparing(transaction -> transaction.getBundleBookNo() == null ? 0 : transaction.getBundleBookNo()))
						.orElse(subscriptionRows.get(0)));
	}

	private SubscriptionStatusDTO buildSubscriptionStatus(List<Transactions> rows) {
		String subscriptionTxnId = rows.get(0).getSubscriptionTxnId();
		Transactions parent = getParentSubscriptionTransaction(rows, subscriptionTxnId);
		int booksUsed = rows.size();
		int booksReturned = (int) rows.stream().filter(transaction -> transaction.getReturnDate() != null).count();
		int openBooks = booksUsed - booksReturned;
		int limit = parent.getBundleBookLimit() == null ? booksUsed : parent.getBundleBookLimit();
		BigDecimal amountPaid = rows.stream()
				.map(Transactions::getAmountPaid)
				.map(this::money)
				.reduce(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), BigDecimal::add);
		boolean canUse = SUBSCRIPTION_ACTIVE.equals(parent.getSubscriptionStatus())
				&& booksUsed < limit
				&& (parent.getSubscriptionEndDate() == null || !LocalDate.now().isAfter(parent.getSubscriptionEndDate()));

		SubscriptionStatusDTO dto = new SubscriptionStatusDTO();
		dto.setHasActiveSubscription(true);
		dto.setCanUseSubscription(canUse);
		dto.setSubscriptionTxnId(subscriptionTxnId);
		dto.setBooksUsed(booksUsed);
		dto.setBooksReturned(booksReturned);
		dto.setOpenBooks(openBooks);
		dto.setBundleBookLimit(limit);
		dto.setAmountPaid(amountPaid);
		dto.setBookRevenueAmount(parent.getBookRevenueAmount());
		dto.setSubscriptionStatus(parent.getSubscriptionStatus());
		dto.setSubscriptionStartDate(parent.getSubscriptionStartDate());
		dto.setSubscriptionEndDate(parent.getSubscriptionEndDate());

		if (parent.getOffer() != null) {
			dto.setOfferId(parent.getOffer().getOfferId());
			dto.setOfferName(parent.getOffer().getOfferName());
		}

		return dto;
	}

	private BookStatus getOrCreateBookStatus(Long statusId, BookStatusEnum statusDesc) {
		return booksStatusRepository.findById(statusId).orElseGet(() -> {
			BookStatus status = new BookStatus();
			status.setStatusId(statusId);
			status.setStatusDesc(statusDesc);
			return booksStatusRepository.save(status);
		});
	}

    private TransactionResponseDTO convertToDto(Transactions transaction) {
		TransactionResponseDTO dto = new TransactionResponseDTO();
		dto.setTransactionId(transaction.getTransactionId());
		dto.setPickupDate(transaction.getPickupDate());
		dto.setReturnDate(transaction.getReturnDate());
		dto.setTotalAmount(transaction.getTotalAmount());
		dto.setSwap(transaction.isSwap());
		dto.setPartiallyPaid(transaction.isPartiallyPaid());
		dto.setAmountPaid(transaction.getAmountPaid());
		dto.setSubscriptionTxnId(transaction.getSubscriptionTxnId());
		dto.setBundleBookNo(transaction.getBundleBookNo());
		dto.setBundleBookLimit(transaction.getBundleBookLimit());
		dto.setSubscriptionStatus(transaction.getSubscriptionStatus());
		dto.setSubscriptionStartDate(transaction.getSubscriptionStartDate());
		dto.setSubscriptionEndDate(transaction.getSubscriptionEndDate());
		dto.setNormalAmount(transaction.getNormalAmount());
		dto.setDiscountAmount(transaction.getDiscountAmount());
		dto.setBookRevenueAmount(transaction.getBookRevenueAmount());

		dto.setCustomerId(transaction.getCustomers().getCustomerId());
		dto.setCustomerName(transaction.getCustomers().getCustomerName());
		dto.setMobileNumber(transaction.getCustomers().getMobileNumber());

		dto.setBookId(transaction.getBooks().getBookId());
		dto.setBookName(transaction.getBooks().getBookName());
		dto.setLendingCost(transaction.getBooks().getLendingCost());

		if (transaction.getOffer() != null) {
			dto.setOfferId(transaction.getOffer().getOfferId());
			dto.setOfferName(transaction.getOffer().getOfferName());
			dto.setOfferType(transaction.getOffer().getOfferType() == null ? null : transaction.getOffer().getOfferType().name());
		}
		

		return dto;
	}
}
