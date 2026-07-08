package com.library.repository;


import com.library.model.Transactions;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


	@Repository
	public interface TransactionsRepository extends JpaRepository<Transactions, String> {
	    //Optional<Transactions> findByBookIdAndReturnDateIsNull(Long bookId);
		
		@Query(value = "SELECT MAX(CAST(SUBSTRING(t.transaction_id, 4) AS INTEGER)) FROM transactions t WHERE t.transaction_id LIKE 'TXN%'", nativeQuery = true)
		Optional<Integer> findMaxTransactionNumber();
		
		@Query(value = "SELECT transaction_id FROM transactions t WHERE t.book_id=:bookId and return_date is null", nativeQuery = true)
		Optional<String> findTxnId(@Param("bookId") Long bookId );
		
		
		@Query(value = "SELECT * FROM transactions t ORDER BY PICKUP_DATE DESC limit 5", nativeQuery = true)
		List<Transactions> findLast5Txns();
		
		@Query(value="SELECT t.*,customer_name, mobile_number,b.lending_cost  FROM TRANSACTIONS t, INVENTORY b,customers c where t.customer_id=c.customer_id and t.book_id=b.book_id and status_id=2 and return_date is null and t.book_id=:bookId",nativeQuery = true)
		List<Transactions> findLentBooks(@Param("bookId") Long bookId );;
	}

