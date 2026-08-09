package com.library.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.Data;

@Data
public class SummaryTransactionDTO {
    private String transactionId;
    private String customerId;
    private String customerName;
    private String mobileNumber;
    private Long communityId;
    private String communityName;
    private Long bookId;
    private String bookName;
    private String author;
    private String genre;
    private LocalDate pickupDate;
    private LocalDate returnDate;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal pendingAmount;
    private BigDecimal normalAmount;
    private BigDecimal discountAmount;
    private BigDecimal bookRevenueAmount;
    private Long offerId;
    private String offerName;
    private String offerType;
    private String subscriptionTxnId;
    private Integer bundleBookNo;
    private Integer bundleBookLimit;
    private String subscriptionStatus;
    private boolean active;
}
