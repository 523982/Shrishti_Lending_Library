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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "offer_id")
    private Offers offer;

    @Column(name = "subscription_txn_id")
    private String subscriptionTxnId;

    @Column(name = "bundle_book_no")
    private Integer bundleBookNo;

    @Column(name = "bundle_book_limit")
    private Integer bundleBookLimit;

    @Column(name = "subscription_status")
    private String subscriptionStatus;

    @Column(name = "subscription_start_date")
    private LocalDate subscriptionStartDate;

    @Column(name = "subscription_end_date")
    private LocalDate subscriptionEndDate;

    @Column(name = "normal_amount")
    private BigDecimal normalAmount;

    @Column(name = "discount_amount")
    private BigDecimal discountAmount;

    @Column(name = "book_revenue_amount")
    private BigDecimal bookRevenueAmount;

    @PrePersist
    public void setDefaults() {
        if (this.pickupDate == null) {
            this.pickupDate = LocalDate.now();
        }
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

	public Offers getOffer() {
		return offer;
	}

	public void setOffer(Offers offer) {
		this.offer = offer;
	}

	public String getSubscriptionTxnId() {
		return subscriptionTxnId;
	}

	public void setSubscriptionTxnId(String subscriptionTxnId) {
		this.subscriptionTxnId = subscriptionTxnId;
	}

	public Integer getBundleBookNo() {
		return bundleBookNo;
	}

	public void setBundleBookNo(Integer bundleBookNo) {
		this.bundleBookNo = bundleBookNo;
	}

	public Integer getBundleBookLimit() {
		return bundleBookLimit;
	}

	public void setBundleBookLimit(Integer bundleBookLimit) {
		this.bundleBookLimit = bundleBookLimit;
	}

	public String getSubscriptionStatus() {
		return subscriptionStatus;
	}

	public void setSubscriptionStatus(String subscriptionStatus) {
		this.subscriptionStatus = subscriptionStatus;
	}

	public LocalDate getSubscriptionStartDate() {
		return subscriptionStartDate;
	}

	public void setSubscriptionStartDate(LocalDate subscriptionStartDate) {
		this.subscriptionStartDate = subscriptionStartDate;
	}

	public LocalDate getSubscriptionEndDate() {
		return subscriptionEndDate;
	}

	public void setSubscriptionEndDate(LocalDate subscriptionEndDate) {
		this.subscriptionEndDate = subscriptionEndDate;
	}

	public BigDecimal getNormalAmount() {
		return normalAmount;
	}

	public void setNormalAmount(BigDecimal normalAmount) {
		this.normalAmount = normalAmount;
	}

	public BigDecimal getDiscountAmount() {
		return discountAmount;
	}

	public void setDiscountAmount(BigDecimal discountAmount) {
		this.discountAmount = discountAmount;
	}

	public BigDecimal getBookRevenueAmount() {
		return bookRevenueAmount;
	}

	public void setBookRevenueAmount(BigDecimal bookRevenueAmount) {
		this.bookRevenueAmount = bookRevenueAmount;
	}
}

