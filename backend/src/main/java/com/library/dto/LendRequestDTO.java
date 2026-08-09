package com.library.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class LendRequestDTO {
    private Long bookId;
    private String customerId;
    private LocalDate pickupDate;
    private BigDecimal totalAmount;
    private boolean isSwap;
    private boolean isPartiallyPaid;
    private BigDecimal amountPaid;
    private Long offerId;
    private String subscriptionTxnId;
	public Long getBookId() {
		return bookId;
	}
	public void setBookId(Long bookId) {
		this.bookId = bookId;
	}
	public String getCustomerId() {
		return customerId;
	}
	public void setCustomerId(String customerId) {
		this.customerId = customerId;
	}
	public LocalDate getPickupDate() {
		return pickupDate;
	}
	public void setPickupDate(LocalDate pickupDate) {
		this.pickupDate = pickupDate;
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
	public Long getOfferId() {
		return offerId;
	}
	public void setOfferId(Long offerId) {
		this.offerId = offerId;
	}
	public String getSubscriptionTxnId() {
		return subscriptionTxnId;
	}
	public void setSubscriptionTxnId(String subscriptionTxnId) {
		this.subscriptionTxnId = subscriptionTxnId;
	}
    
}
