package com.library.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "communities")
@Data
@JsonIgnoreProperties({"hibernaeLazyInitializer","handler"})
public class Communities {

	@Id
	//@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "community_id")
	private Long communityId;

	
	@Column(name = "community_name", nullable = false, unique = true)
	private String communityName;
	
	
	public void setCommunityId(Long communityId) {
		this.communityId = communityId;
	}

	public void setCommunityName(String communityName) {
		this.communityName = communityName;
	}

	public Long getCommunityId() {
		return communityId;
	}
	
	public String getCommunityName() {
		return communityName;
	}
}
