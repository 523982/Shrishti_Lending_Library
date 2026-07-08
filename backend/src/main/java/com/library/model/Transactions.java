package com.library.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.hibernate.annotations.ColumnDefault;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "transactions")
@Data
@JsonIgnoreProperties({"hibernaeLazyInitializer","handler"})
public class Transactions {

    @Id
    @Column(name = "transaction_id")
    private String transactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernaeLazyInitializer","handler"})
    @JoinColumn(name = "customer_id", nullable = false)
    private Customers customers;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Books books;

    @Column(name = "pickup_date", nullable = false)
    private LocalDate pickupDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "is_swap")
    private boolean isSwap;

    @Column(name = "is_partially_paid")
    @ColumnDefault("false")
    private boolean isPartiallyPaid;

    @Column(name = "amount_paid")
    private BigDecimal amountPaid;

    @PrePersist
    public void setDefaults() {
        this.pickupDate = LocalDate.now();
    }
    
    public String getTransactionId() {
		return transactionId;
	}

	public void setTransactionId(String transactionId) {
		this.transactionId = transactionId;
	}

	public Customers getCustomers() {
		return customers;
	}

	public void setCustomers(Customers customers) {
		this.customers = customers;
	}

	public Books getBooks() {
		return books;
	}

	public void setBooks(Books books) {
		this.books = books;
	}

	public LocalDate getPickupDate() {
		return pickupDate;
	}

	public void setPickupDate(LocalDate pickupDate) {
		this.pickupDate = pickupDate;
	}

	public LocalDate getReturnDate() {
		return returnDate;
	}

	public void setReturnDate(LocalDate returnDate) {
		this.returnDate = returnDate;
	}

	public BigDecimal getTotalAmount() {
		return totalAmount;
	}

	public void setTotalAmount(BigDecimal totalAmount) {
		this.totalAmount = totalAmount;
	}

	public boolean isSwap() {
		return isSwap;
	}

	public void setSwap(boolean isSwap) {
		this.isSwap = isSwap;
	}

	public boolean isPartiallyPaid() {
		return isPartiallyPaid;
	}

	public void setPartiallyPaid(boolean isPartiallyPaid) {
		this.isPartiallyPaid = isPartiallyPaid;
	}

	public BigDecimal getAmountPaid() {
		return amountPaid;
	}

	public void setAmountPaid(BigDecimal amountPaid) {
		this.amountPaid = amountPaid;
	}
}

