package com.library.service;

import java.util.ArrayList;
import java.util.List;
import com.library.dto.CustomerRequestDTO;
import java.util.Optional;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.library.exception.ResourceNotFoundException;
import com.library.model.Books;
import com.library.model.Communities;
import com.library.model.Customers;
import com.library.repository.CommunitiesRepository;
import com.library.repository.CustomersRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor // Creates a constructor with all final fields
public class CustomerService {

    private final CustomersRepository customersRepository;
    private final CommunitiesRepository communitiesRepository;
    
    public CustomerService(CustomersRepository customersRepository,CommunitiesRepository communitiesRepository) {
    	this.customersRepository=customersRepository;
    	this.communitiesRepository=communitiesRepository;
    }

    public List<Customers> getAllCustomers() {
        return customersRepository.findAll();
    }

    public Customers getCustomerById(Long customerId) {
        return customersRepository.findById(customerId).orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
    }
    
    private String createCustomerId(CustomerRequestDTO request) {
    	String newCustId;
    	Integer maxCustId=customersRepository.findMaxCustomerId() + 1;
    	if (maxCustId.toString().length()!=3){
    	newCustId= request.getCommunityId()+"0"+request.getUnitNumber()+"0"+maxCustId;
    	} else
    	newCustId= request.getCommunityId()+"0"+request.getUnitNumber()+maxCustId;	
    	System.out.println("new custid "+ newCustId);
    	return newCustId;
    }

    

    public Customers createCustomer(CustomerRequestDTO request) {
    	
    	Communities community = communitiesRepository.findById(request.getCommunityId())
                .orElseThrow(() -> new ResourceNotFoundException("Community not found with id: " + request.getCommunityId()));
    	
    	Customers customer= new Customers();
    	customer.setCustomerId(createCustomerId(request));
    	customer.setBlockNumber(request.getBlockNumber());
    	customer.setCommunity(community);
    	customer.setCustomerName(request.getCustomerName());
    	customer.setMobileNumber(request.getMobileNumber());
    	customer.setUnitNumber(request.getUnitNumber());
        // Add any validation logic here before saving
        return customersRepository.save(customer);
    }
    
    public Long getCustomersCount() {
    	return customersRepository.count();
    }

    public Customers updateCustomer(Long customerId, Customers customerDetails) {
        Customers customer = getCustomerById(customerId); // Re-uses the findById logic
        return customersRepository.save(customer);
    }

    public void deleteCustomer(Long customerId) {
    	if (!customersRepository.existsById(customerId)) {
	        throw new EntityNotFoundException("Customer not found with id: " + customerId);
	    }    
    	customersRepository.deleteById(customerId);
    }
    
    public List<Customers> searchCustomers(String nameQuery, Long communityId) {
        // Use a Specification to build the query dynamically
        Specification<Customers> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Add predicate for the name search (if provided)
            if (nameQuery != null && !nameQuery.isEmpty()) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("customerName")), "%" + nameQuery.toLowerCase() + "%"));
            }

            // 2. Add predicate for the community filter (if provided)
            if (communityId != null) {
                predicates.add(criteriaBuilder.equal(root.get("community").get("communityId"), communityId));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return customersRepository.findAll(spec);
    }
    
}
