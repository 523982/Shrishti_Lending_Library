package com.library.dto;

public class CommunityDTO {
	
	public Long getCommunityId() {
		return communityId;
	}
	
	public String getCommunityName() {
		return communityName;
	}
	
	private Long communityId;

	private String communityName;
	
	
	public void setCommunityId(Long communityId) {
		this.communityId = communityId;
	}

	public void setCommunityName(String communityName) {
		this.communityName = communityName;
	}

}
