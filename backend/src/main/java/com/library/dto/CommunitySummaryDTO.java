package com.library.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class CommunitySummaryDTO {
    private Long communityId;
    private String communityName;
    private Long activeOfferId;
    private boolean offerActive;
    private OfferResponseDTO activeOffer;
    private int customerCount;
    private int activeLendingCount;
    private int totalTransactions;
    private BigDecimal totalBilled = BigDecimal.ZERO;
    private BigDecimal totalCollected = BigDecimal.ZERO;
    private BigDecimal totalPending = BigDecimal.ZERO;
    private BigDecimal totalBookRevenue = BigDecimal.ZERO;
    private List<SummaryTransactionDTO> activeBooks = new ArrayList<>();
    private List<SummaryTransactionDTO> history = new ArrayList<>();
}
