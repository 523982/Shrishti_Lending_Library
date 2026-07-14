package com.library.dto;

import java.time.LocalDate;

public class ReturnRequestDTO {
    private LocalDate returnDate;
    private boolean isSwap;

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
}
