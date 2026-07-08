package com.library.dto;

import java.math.BigDecimal;

import com.library.enums.BookStatusEnum;

public class BooksDTO {
    private Long bookId;
    private String bookName;
    private String author;
    private BigDecimal lendingCost;
    private BookStatusDTO bookstatus; // Use the DTO here

	public Long getBookId() {
		return bookId;
	}
	public void setBookId(Long bookId) {
		this.bookId = bookId;
	}
	public String getBookName() {
		return bookName;
	}
	public void setBookName(String bookName) {
		this.bookName = bookName;
	}
	public String getAuthor() {
		return author;
	}
	public void setAuthor(String author) {
		this.author = author;
	}
	public BigDecimal getLendingCost() {
		return lendingCost;
	}
	public void setLendingCost(BigDecimal bigDecimal) {
		this.lendingCost = bigDecimal;
	}

	public BookStatusDTO getBookstatus() {
		return bookstatus;
	}
	public void setBookstatus(BookStatusDTO bookstatus) {
		this.bookstatus = bookstatus;
	}
    
}
