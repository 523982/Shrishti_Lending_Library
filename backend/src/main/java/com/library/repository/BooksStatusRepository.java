package com.library.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.library.model.BookStatus;

public interface BooksStatusRepository extends JpaRepository<BookStatus, Long> {

}
