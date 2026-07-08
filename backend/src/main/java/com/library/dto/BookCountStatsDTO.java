package com.library.dto;

public class BookCountStatsDTO {

    private long totalBooks;
    private long booksOnLoan;

    // Constructors
    public BookCountStatsDTO() {
    }

    public BookCountStatsDTO(long totalBooks, long booksOnLoan) {
        this.totalBooks = totalBooks;
        this.booksOnLoan = booksOnLoan;
    }

    // Getters and Setters
    public long getTotalBooks() {
        return totalBooks;
    }

    public void setTotalBooks(long totalBooks) {
        this.totalBooks = totalBooks;
    }

    public long getBooksOnLoan() {
        return booksOnLoan;
    }

    public void setBooksOnLoan(long booksOnLoan) {
        this.booksOnLoan = booksOnLoan;
    }
}
