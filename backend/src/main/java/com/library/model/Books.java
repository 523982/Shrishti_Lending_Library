package com.library.model;


import java.math.BigDecimal;

import org.hibernate.annotations.Cascade;

import org.hibernate.annotations.CascadeType;

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
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;


@Entity
@Table(name = "inventory")
@Data
//@JsonIgnoreProperties({"hibernaeLazyInitializer","handler"})
public class Books {

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

	public BookStatus getBookStatus() {
		return bookStatus;
	}

	public void setBookStatus(BookStatus bookStatus) {
		this.bookStatus = bookStatus;
	}

	public BigDecimal getLendingCost() {
		return lendingCost;
	}

	public void setLendingCost(BigDecimal lendingCost) {
		this.lendingCost = lendingCost;
	}

	public BigDecimal getPurchasePrice() {
		return purchasePrice;
	}

	public void setPurchasePrice(BigDecimal purchasePrice) {
		this.purchasePrice = purchasePrice;
	}

	@Id
    //@GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "book_id")
    private Long bookId;

    @NotBlank(message = "Book name cannot be blank")
    @Column(name = "book_name", nullable = false)
    private String bookName;

    private String author;

    private String genre;

    //@Column(columnDefinition = "varchar(255) default 'Available'")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "status_id")
    private BookStatus bookStatus;

    @NotNull(message = "Lending cost cannot be null")
    @DecimalMin(value = "0.0", message = "Lending cost must be zero or greater")
    @Column(name = "lending_cost", nullable = false)
    private BigDecimal lendingCost;

    @Column(name = "purchase_price")
    private BigDecimal purchasePrice;
}

