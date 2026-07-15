package com.library.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.library.dto.CustomerRequestDTO;
import com.library.model.Customers;
import com.library.service.CustomerService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/customers")
public class CustomersController {

    private final CustomerService customerService;
    
    public CustomersController(CustomerService customerService) {
    	this.customerService=customerService;
    }

    // Get all customers
    @GetMapping
    public List<Customers> getAllCustomers() {
        return customerService.getAllCustomers();
    }
    
    @GetMapping("/count")
    public Long getCustomersCount() {
    	return customerService.getCustomersCount();
    }

    // Get a single customer by ID
    @GetMapping("/{id}")
    public ResponseEntity<Customers> getCustomerById(@PathVariable(value = "id") String customerId) {
        Customers customer = customerService.getCustomerById(customerId);
        return ResponseEntity.ok().body(customer);
    }

    // Create a new customer
    @PostMapping
    public Customers createCustomer(@Valid @RequestBody CustomerRequestDTO request) {
        return customerService.createCustomer(request);
    }

    // Update a customer
    @PutMapping("/{id}")
    public ResponseEntity<Customers> updateCustomer(@PathVariable(value = "id") String customerId,
                                                   @Valid @RequestBody CustomerRequestDTO customerDetails) {
        final Customers updatedCustomer = customerService.updateCustomer(customerId, customerDetails);
        return ResponseEntity.ok(updatedCustomer);
    }

    // Delete a customer
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable(value = "id") String customerId) {
        customerService.deleteCustomer(customerId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Customers>> searchCustomers(
            @RequestParam("q") String query,
            @RequestParam(value = "communityId", required = false) Long communityId) {
        List<Customers> customers = customerService.searchCustomers(query, communityId);
        return ResponseEntity.ok(customers);
    }
}
