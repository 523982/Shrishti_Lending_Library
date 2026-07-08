package com.library.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.library.model.Books;
import com.library.model.Customers;

@Repository
//Extend JpaSpecificationExecutor to enable dynamic, criteria-based queries
public interface CustomersRepository extends JpaRepository<Customers, Long>, JpaSpecificationExecutor<Customers> {


	// Spring Data JPA provides all necessary CRUD methods.
	
	@Query(value = "SELECT max(substr(customer_id, length(customer_id)-2,3)) trimmed FROM CUSTOMERS", nativeQuery = true)
	Integer findMaxCustomerId();
	
	List<Customers> findByCustomerNameContainingIgnoreCase(String query);
}

