package com.library.service;

import com.library.dto.LendRequestDTO;
import com.library.dto.ReturnRequestDTO;
import com.library.dto.TransactionResponseDTO;
import com.library.enums.BookStatusEnum;
import com.library.exception.ResourceNotFoundException;
import com.library.model.BookStatus;
import com.library.model.Books;
import com.library.model.Customers;
import com.library.model.Transactions;
import com.library.repository.BooksRepository;
import com.library.repository.BooksStatusRepository;
import com.library.repository.CustomersRepository;
import com.library.repository.TransactionsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionsService {

	public TransactionsService(TransactionsRepository transactionsRepository, BooksRepository booksRepository,
			CustomersRepository customersRepository,BooksStatusRepository booksStatusRepository) {
		super();
		this.transactionsRepository = transactionsRepository;
		this.booksRepository = booksRepository;
		this.customersRepository = customersRepository;
		this.booksStatusRepository=booksStatusRepository;
	}

	private final TransactionsRepository transactionsRepository;
	private final BooksRepository booksRepository;
	private final BooksStatusRepository booksStatusRepository;
	private final CustomersRepository customersRepository;

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
		return "TXN" + nextNumber;
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

		BigDecimal amountPaid = lendRequest.getAmountPaid();
		// Business logic: If not partially paid, amount paid must equal total amount.
		if (!lendRequest.isPartiallyPaid()) {
			amountPaid = lendRequest.getTotalAmount();
		}

		// Update book status
		book.setBookStatus(unavailableStatus);
		booksRepository.save(book);

		// Create and save the transaction
		Transactions transaction = new Transactions();

		transaction.setTransactionId(generateNextTransactionId()); // Assuming String ID
		transaction.setBooks(book);
		transaction.setCustomers(customer);
		transaction.setPickupDate(lendRequest.getPickupDate() != null ? lendRequest.getPickupDate() : LocalDate.now());
		transaction.setTotalAmount(lendRequest.getTotalAmount());
		transaction.setSwap(lendRequest.isSwap());
		transaction.setPartiallyPaid(lendRequest.isPartiallyPaid());
		transaction.setAmountPaid(amountPaid);

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

		long days = ChronoUnit.DAYS.between(transactions.getPickupDate(), returnDate);
		long weeks = Math.max(1L, (days + 6L) / 7L);
		boolean isSwap = returnRequest != null ? returnRequest.isSwap() : transactions.isSwap();
		BigDecimal finalAmount = transactions.getBooks().getLendingCost().multiply(BigDecimal.valueOf(weeks));
		if (isSwap) {
			finalAmount = finalAmount.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
		}

		transactions.setReturnDate(returnDate);
		transactions.setSwap(isSwap);
		transactions.setTotalAmount(finalAmount);
		if (!transactions.isPartiallyPaid()) {
			transactions.setAmountPaid(finalAmount);
		}

		Books books = transactions.getBooks();
		books.setBookStatus(availableStatus);
		booksRepository.save(books);

		Transactions savedTransaction = transactionsRepository.save(transactions);
		return convertToDto(savedTransaction);

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

		dto.setCustomerId(transaction.getCustomers().getCustomerId());
		dto.setCustomerName(transaction.getCustomers().getCustomerName());
		dto.setMobileNumber(transaction.getCustomers().getMobileNumber());

		dto.setBookId(transaction.getBooks().getBookId());
		dto.setBookName(transaction.getBooks().getBookName());
		dto.setLendingCost(transaction.getBooks().getLendingCost());
		

		return dto;
	}
}
