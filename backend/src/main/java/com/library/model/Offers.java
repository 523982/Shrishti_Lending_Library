package com.library.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.library.enums.OfferType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "offers")
@JsonIgnoreProperties({"hibernaeLazyInitializer", "handler"})
public class Offers {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "offer_id")
    private Long offerId;

    @Column(name = "offer_name", nullable = false)
    private String offerName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "community_id", nullable = false)
    @JsonIgnoreProperties({"hibernaeLazyInitializer", "handler"})
    private Communities community;

    @Enumerated(EnumType.STRING)
    @Column(name = "offer_type", nullable = false)
    private OfferType offerType;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "discount_percent")
    private BigDecimal discountPercent;

    @Column(name = "bundle_book_count")
    private Integer bundleBookCount;

    @Column(name = "bundle_price")
    private BigDecimal bundlePrice;

    @Column(name = "bundle_duration_days")
    private Integer bundleDurationDays;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    public void setDefaults() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
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

    public Communities getCommunity() {
        return community;
    }

    public void setCommunity(Communities community) {
        this.community = community;
    }

    public OfferType getOfferType() {
        return offerType;
    }

    public void setOfferType(OfferType offerType) {
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

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
