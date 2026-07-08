package com.library.controller;


import com.library.dto.LendRequestDTO;
import com.library.dto.TransactionResponseDTO;
import com.library.model.Transactions;
import com.library.service.TransactionsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

	@RestController
	@RequestMapping("/api/transactions")
	@RequiredArgsConstructor
	public class TransactionsController {

	    private final TransactionsService transactionsService;
	    

		public TransactionsController(TransactionsService transactionsService) {
			super();
			this.transactionsService = transactionsService;
		}

	    @GetMapping
	    public List<TransactionResponseDTO> getAllTransactions() {
	        return transactionsService.getAllTransactions();
	    }
	    
	    
	    @GetMapping("/latest")
	    public List<TransactionResponseDTO> findLast5Txns() {
	        return transactionsService.findLast5Txns();
	    }
	    
	    @GetMapping("/book/{id}/active")
	    public List<TransactionResponseDTO> lentBooks(@PathVariable(value = "id") Long bookId){
	    	return transactionsService.lentBooks(bookId);
	    }
	    
	    // Endpoint to lend a book
	    @PostMapping("/lend")
	    @ResponseStatus(HttpStatus.CREATED)
	    public Transactions lendBook(@RequestBody LendRequestDTO lendRequest) {
	        return transactionsService.lendBook(lendRequest);
	    }

	    // Endpoint to return a book
	    @PutMapping("/{id}/return")
	    //public ResponseEntity<TransactionResponseDTO> returnBook(@PathVariable(value = "id") String transactionId) {
	    public ResponseEntity<TransactionResponseDTO> returnBook(@PathVariable(value = "id") Long bookId) {
	    	TransactionResponseDTO updatedTransactions = transactionsService.returnBook(bookId);
	        return ResponseEntity.ok(updatedTransactions);
	    }

	}

