package com.library.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ReturnRequestDTO {
    private LocalDate returnDate;
    private boolean isSwap;
    private BigDecimal amountPaid;

    public LocalDate getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }

    public boolean isSwap() {
        return isSwap;
    }

    public void setSwap(boolean isSwap) {
        this.isSwap = isSwap;
    }

    public void setIsSwap(boolean isSwap) {
        this.isSwap = isSwap;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(BigDecimal amountPaid) {
        this.amountPaid = amountPaid;
    }
}
