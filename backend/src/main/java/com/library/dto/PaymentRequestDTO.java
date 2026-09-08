package com.library.dto;

import java.math.BigDecimal;

public class PaymentRequestDTO {
    private BigDecimal amountPaid;

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(BigDecimal amountPaid) {
        this.amountPaid = amountPaid;
    }
}
