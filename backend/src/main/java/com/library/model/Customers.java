package com.library.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "customers")
@JsonIgnoreProperties({"hibernaeLazyInitializer","handler"})
public class Customers {

    public String getCustomerId() {
		return customerId;
	}

	public String getCustomerName() {
		return customerName;
	}


	public String getBlockNumber() {
		return blockNumber;
	}

	public String getUnitNumber() {
		return unitNumber;
	}

	public String getMobileNumber() {
		return mobileNumber;
	}


	public Communities getCommunity() {
		return community;
	}
	
	public void setCustomerId(String customerId) {
		this.customerId = customerId;
	}

	public void setCustomerName(String customerName) {
		this.customerName = customerName;
	}

	public void setBlockNumber(String blockNumber) {
		this.blockNumber = blockNumber;
	}

	public void setUnitNumber(String unitNumber) {
		this.unitNumber = unitNumber;
	}

	public void setMobileNumber(String mobileNumber) {
		this.mobileNumber = mobileNumber;
	}

	public void setCommunity(Communities community) {
		this.community = community;
	}

	@Id
    //@GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_id")
    private String customerId;

    @NotBlank(message = "Customer name cannot be blank")
    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "block_number")
    private String blockNumber;

    @Column(name = "unit_number")
    private String unitNumber;

    @Column(name = "mobile_number")
    private String mobileNumber;

    @NotNull(message = "Community cannot be null")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "community_id", nullable = false)
    private Communities community;


}
