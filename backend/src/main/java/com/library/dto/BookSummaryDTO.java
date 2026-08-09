package com.library.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class BookSummaryDTO {
    private Long bookId;
    private String bookName;
    private String author;
    private String genre;
    private String imageUrl;
    private Long statusId;
    private String statusDesc;
    private BigDecimal lendingCost;
    private BigDecimal purchasePrice;
    private LocalDate purchaseDate;
    private int timesLent;
    private BigDecimal totalBilled = BigDecimal.ZERO;
    private BigDecimal totalCollected = BigDecimal.ZERO;
    private BigDecimal totalPending = BigDecimal.ZERO;
    private BigDecimal totalBookRevenue = BigDecimal.ZERO;
    private BigDecimal estimatedProfit = BigDecimal.ZERO;
    private SummaryTransactionDTO activeTransaction;
    private List<SummaryTransactionDTO> history = new ArrayList<>();
}
