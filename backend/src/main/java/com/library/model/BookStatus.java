package com.library.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.library.enums.BookStatusEnum;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "Book_Status")
@Data
@JsonIgnoreProperties({"hibernaeLazyInitializer","handler"})
public class BookStatus {
	
	@Id
    @Column(name = "status_id")
    private Long statusId;

    @Enumerated(EnumType.STRING)
    @Column(name = "description", nullable = false)
    private BookStatusEnum statusDesc;

	public Long getStatusId() {
		return statusId;
	}

	public void setStatusId(Long statusId) {
		this.statusId = statusId;
	}

	public BookStatusEnum getStatusDesc() {
		return statusDesc;
	}

	public void setStatusDesc(BookStatusEnum statusDesc) {
		this.statusDesc = statusDesc;
	}

}
