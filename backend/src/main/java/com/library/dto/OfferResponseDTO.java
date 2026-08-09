package com.library.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class OfferResponseDTO {
    private Long offerId;
    private String offerName;
    private Long communityId;
    private String communityName;
    private String offerType;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal discountPercent;
    private Integer bundleBookCount;
    private BigDecimal bundlePrice;
    private Integer bundleDurationDays;
    private boolean active;

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

    public Long getCommunityId() {
        return communityId;
    }

    public void setCommunityId(Long communityId) {
        this.communityId = communityId;
    }

    public String getCommunityName() {
        return communityName;
    }

    public void setCommunityName(String communityName) {
        this.communityName = communityName;
    }

    public String getOfferType() {
        return offerType;
    }

    public void setOfferType(String offerType) {
        this.offerType = offerType;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public BigDecimal getDiscountPercent() {
        return discountPercent;
    }

    public void setDiscountPercent(BigDecimal discountPercent) {
        this.discountPercent = discountPercent;
    }

    public Integer getBundleBookCount() {
        return bundleBookCount;
    }

    public void setBundleBookCount(Integer bundleBookCount) {
        this.bundleBookCount = bundleBookCount;
    }

    public BigDecimal getBundlePrice() {
        return bundlePrice;
    }

    public void setBundlePrice(BigDecimal bundlePrice) {
        this.bundlePrice = bundlePrice;
    }

    public Integer getBundleDurationDays() {
        return bundleDurationDays;
    }

    public void setBundleDurationDays(Integer bundleDurationDays) {
        this.bundleDurationDays = bundleDurationDays;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
