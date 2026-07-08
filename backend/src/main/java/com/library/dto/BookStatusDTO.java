package com.library.dto;

import com.library.enums.BookStatusEnum;

//In a package like com.yourlibrary.dto
public class BookStatusDTO {
 private Long statusId;
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
public void setStatusDesc(BookStatusEnum bookStatusEnum) {
	this.statusDesc = bookStatusEnum;
}


}
