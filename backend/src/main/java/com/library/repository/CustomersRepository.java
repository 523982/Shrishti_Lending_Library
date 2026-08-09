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
public interface CustomersRepository extends JpaRepository<Customers, String>, JpaSpecificationExecutor<Customers> {


	// Spring Data JPA provides all necessary CRUD methods.
	
	@Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id, LENGTH(customer_id) - 2, 3) AS INTEGER)), 0) FROM customers", nativeQuery = true)
	Integer findMaxCustomerId();
	
	List<Customers> findByCustomerNameContainingIgnoreCase(String query);

	long countByCommunityCommunityId(Long communityId);
}

