package com.library.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TransactionResponseDTO {

		private String transactionId;
		private String customerId;
	    private String customerName;
	    private String mobileNumber; 
	    private BigDecimal lendingCost;
		private Long bookId;
	    private String bookName;
	    private LocalDate pickupDate;
	    private LocalDate returnDate;
	    private BigDecimal totalAmount;
	    private boolean isSwap;
	    private boolean isPartiallyPaid;
	    private BigDecimal amountPaid;
	    
	    
	    public String getTransactionId() {
			return transactionId;
		}
		public void setTransactionId(String transactionId) {
			this.transactionId = transactionId;
		}
		public String getCustomerId() {
			return customerId;
		}
		public void setCustomerId(String customerId) {
			this.customerId = customerId;
		}
		public String getCustomerName() {
			return customerName;
		}
		public void setCustomerName(String customerName) {
			this.customerName = customerName;
		}
	    public String getMobileNumber() {
			return mobileNumber;
		}
		public void setMobileNumber(String mobileNumber) {
			this.mobileNumber = mobileNumber;
		}
		public BigDecimal getLendingCost() {
			return lendingCost;
		}
		public void setLendingCost(BigDecimal lendingCost) {
			this.lendingCost = lendingCost;
		}
		public Long getBookId() {
			return bookId;
		}
		public void setBookId(Long bookId) {
			this.bookId = bookId;
		}
		public String getBookName() {
			return bookName;
		}
		public void setBookName(String bookName) {
			this.bookName = bookName;
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
