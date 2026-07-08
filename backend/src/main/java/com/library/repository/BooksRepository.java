package com.library.repository;


import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.library.model.Books;

@Repository
public interface BooksRepository extends JpaRepository<Books, Long> {
    // Spring Data JPA provides CRUD methods out of the box.
	
	@Query(value = "SELECT MAX(BOOK_ID) FROM INVENTORY", nativeQuery = true)
	Long findMaxBookId();
	
	@Query(value = "SELECT count(*) FROM INVENTORY WHERE status_id = 2", nativeQuery = true)
    long countUnavailableBooks();
	
	@Query(value = "SELECT * FROM INVENTORY WHERE status_id = 2", nativeQuery = true)
    List<Books> lentBooks(String query);	
	
	List<Books> findByBookNameContainingIgnoreCase(String query);
}


