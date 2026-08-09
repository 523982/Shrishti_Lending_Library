package com.library.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class CustomerSummaryDTO {
    private String customerId;
    private String customerName;
    private String blockNumber;
    private String unitNumber;
    private String mobileNumber;
    private Long communityId;
    private String communityName;
    private int activeBookCount;
    private int totalTransactions;
    private BigDecimal totalBilled = BigDecimal.ZERO;
    private BigDecimal totalCollected = BigDecimal.ZERO;
    private BigDecimal totalPending = BigDecimal.ZERO;
    private BigDecimal totalBookRevenue = BigDecimal.ZERO;
    private SubscriptionStatusDTO activeSubscription;
    private List<SummaryTransactionDTO> activeBooks = new ArrayList<>();
    private List<SummaryTransactionDTO> history = new ArrayList<>();
}
