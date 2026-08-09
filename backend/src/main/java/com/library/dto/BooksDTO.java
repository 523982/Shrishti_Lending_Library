package com.library.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class BooksDTO {
    private Long bookId;
    private String bookName;
    private String author;
    private String genre;
    private BigDecimal lendingCost;
    private LocalDate purchaseDate;
    private String imageUrl;
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
	public String getGenre() {
		return genre;
	}
	public void setGenre(String genre) {
		this.genre = genre;
	}
	public BigDecimal getLendingCost() {
		return lendingCost;
	}
	public void setLendingCost(BigDecimal bigDecimal) {
		this.lendingCost = bigDecimal;
	}

	public LocalDate getPurchaseDate() {
		return purchaseDate;
	}

	public void setPurchaseDate(LocalDate purchaseDate) {
		this.purchaseDate = purchaseDate;
	}

	public String getImageUrl() {
		return imageUrl;
	}

	public void setImageUrl(String imageUrl) {
		this.imageUrl = imageUrl;
	}

	public BookStatusDTO getBookstatus() {
		return bookstatus;
	}
	public void setBookstatus(BookStatusDTO bookstatus) {
		this.bookstatus = bookstatus;
	}
    
}
