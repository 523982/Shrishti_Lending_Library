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
	    private Long offerId;
	    private String offerName;
	    private String offerType;
	    private String subscriptionTxnId;
	    private Integer bundleBookNo;
	    private Integer bundleBookLimit;
	    private String subscriptionStatus;
	    private LocalDate subscriptionStartDate;
	    private LocalDate subscriptionEndDate;
	    private BigDecimal normalAmount;
	    private BigDecimal discountAmount;
	    private BigDecimal bookRevenueAmount;
	    
	    
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
		public Long getOfferId() {
			return offerId;
		}
		public void setOfferId(Long offerId) {
			this.offerId = offerId;
		}
		public String getOfferName() {
			return offerName;
		}
		public void setOfferName(String offerName) {
			this.offerName = offerName;
		}
		public String getOfferType() {
			return offerType;
		}
		public void setOfferType(String offerType) {
			this.offerType = offerType;
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
