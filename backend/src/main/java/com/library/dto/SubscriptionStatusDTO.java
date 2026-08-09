package com.library.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class SubscriptionStatusDTO {
    private boolean hasActiveSubscription;
    private boolean canUseSubscription;
    private String subscriptionTxnId;
    private Long offerId;
    private String offerName;
    private Integer booksUsed;
    private Integer booksReturned;
    private Integer openBooks;
    private Integer bundleBookLimit;
    private BigDecimal amountPaid;
    private BigDecimal bookRevenueAmount;
    private String subscriptionStatus;
    private LocalDate subscriptionStartDate;
    private LocalDate subscriptionEndDate;

    public boolean isHasActiveSubscription() {
        return hasActiveSubscription;
    }

    public void setHasActiveSubscription(boolean hasActiveSubscription) {
        this.hasActiveSubscription = hasActiveSubscription;
    }

    public boolean isCanUseSubscription() {
        return canUseSubscription;
    }

    public void setCanUseSubscription(boolean canUseSubscription) {
        this.canUseSubscription = canUseSubscription;
    }

    public String getSubscriptionTxnId() {
        return subscriptionTxnId;
    }

    public void setSubscriptionTxnId(String subscriptionTxnId) {
        this.subscriptionTxnId = subscriptionTxnId;
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

    public Integer getBooksUsed() {
        return booksUsed;
    }

    public void setBooksUsed(Integer booksUsed) {
        this.booksUsed = booksUsed;
    }

    public Integer getBooksReturned() {
        return booksReturned;
    }

    public void setBooksReturned(Integer booksReturned) {
        this.booksReturned = booksReturned;
    }

    public Integer getOpenBooks() {
        return openBooks;
    }

    public void setOpenBooks(Integer openBooks) {
        this.openBooks = openBooks;
    }

    public Integer getBundleBookLimit() {
        return bundleBookLimit;
    }

    public void setBundleBookLimit(Integer bundleBookLimit) {
        this.bundleBookLimit = bundleBookLimit;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(BigDecimal amountPaid) {
        this.amountPaid = amountPaid;
    }

    public BigDecimal getBookRevenueAmount() {
        return bookRevenueAmount;
    }

    public void setBookRevenueAmount(BigDecimal bookRevenueAmount) {
        this.bookRevenueAmount = bookRevenueAmount;
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
}
