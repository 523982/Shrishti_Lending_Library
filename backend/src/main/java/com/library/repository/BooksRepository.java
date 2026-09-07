package com.library.repository;


import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.library.model.Books;

@Repository
public interface BooksRepository extends JpaRepository<Books, Long> {
    // Spring Data JPA provides CRUD methods out of the box.
	
	@Query(value = "SELECT MAX(BOOK_ID) FROM INVENTORY", nativeQuery = true)
	Long findMaxBookId();
	
	@Query(value = "SELECT count(*) FROM INVENTORY WHERE status_id = 2", nativeQuery = true)
    long countUnavailableBooks();
	
	@Query(value = "SELECT * FROM INVENTORY WHERE status_id = 2 AND LOWER(book_name) LIKE LOWER(CONCAT('%', :query, '%'))", nativeQuery = true)
    List<Books> lentBooks(@Param("query") String query);	

	@Query("SELECT b FROM Books b WHERE b.bookStatus IS NULL OR b.bookStatus.statusId <> :statusId")
	List<Books> findByStatusIdNot(@Param("statusId") Long statusId);
	
	@Query("SELECT b FROM Books b WHERE LOWER(b.bookName) LIKE LOWER(CONCAT('%', :query, '%')) AND (b.bookStatus IS NULL OR b.bookStatus.statusId <> :statusId)")
	List<Books> searchByBookNameExcludingStatus(@Param("query") String query, @Param("statusId") Long statusId);
	
	List<Books> findByBookNameContainingIgnoreCase(String query);
}


