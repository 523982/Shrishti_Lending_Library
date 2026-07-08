package com.library.dto;

import com.library.model.Communities;


public class CustomerRequestDTO {
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


	public Long getCommunityId() {
		return communityId;
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

	public void setCommunityId(Long communityId) {
		this.communityId = communityId;
	}

    private String customerId;

    private String customerName;

    private String blockNumber;

    private String unitNumber;

    private String mobileNumber;

    private Long communityId;

}
