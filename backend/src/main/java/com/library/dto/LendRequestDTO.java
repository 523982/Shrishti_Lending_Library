package com.library.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class LendRequestDTO {
    private Long bookId;
    private Long customerId;
    private BigDecimal totalAmount;
    private boolean isSwap;
    private boolean isPartiallyPaid;
    private BigDecimal amountPaid;
	public Long getBookId() {
		return bookId;
	}
	public void setBookId(Long bookId) {
		this.bookId = bookId;
	}
	public Long getCustomerId() {
		return customerId;
	}
	public void setCustomerId(Long customerId) {
		this.customerId = customerId;
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
