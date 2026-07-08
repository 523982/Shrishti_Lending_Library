package com.library.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.library.dto.BookCountStatsDTO;
import com.library.dto.BooksDTO;
import com.library.model.Books;
import com.library.model.Customers;
import com.library.service.BooksService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class BooksController {

    private final BooksService booksService;
    
    @Autowired
    public BooksController(BooksService booksService) {
    	this.booksService=booksService;
    }
    
    // Get a single customer by ID
    @GetMapping("/{id}")
    public ResponseEntity<Books> getBooksById(@PathVariable(value = "id") Long bookId) {
        Books books = booksService.getBooksById(bookId);
        return ResponseEntity.ok().body(books);
    }
    

    @GetMapping
    public List<BooksDTO> getAllBooks() {
        return booksService.getAllBooks();
    }
    
    @GetMapping("/count")
    public ResponseEntity<BookCountStatsDTO> getBookCounts() {
        BookCountStatsDTO stats = booksService.getBookCountStats();
        return ResponseEntity.ok(stats);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BooksDTO addBook(@Valid @RequestBody Books book) {
        return booksService.addBooks(book);
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Books>> searchBooks(@RequestParam("q") String query) {
        List<Books> books = booksService.searchBooks(query);
        return ResponseEntity.ok(books);
    }
    
    @GetMapping("/searchlent")
    public ResponseEntity<List<Books>> searchLentBooks(@RequestParam("q") String query) {
        List<Books> books = booksService.searchLentBooks(query);
        return ResponseEntity.ok(books);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Books> updateBook(@PathVariable("id") Long bookId, @RequestBody Books bookDetails) {
        Books updatedBook = booksService.updateBook(bookId, bookDetails);
        return ResponseEntity.ok(updatedBook);
    }
    
    @PutMapping("/remove/{id}")
    public ResponseEntity<BooksDTO> removeBook(@PathVariable(value = "id") Long bookId) {
    	 BooksDTO removedBk=booksService.removeBook(bookId);
        return ResponseEntity.ok(removedBk);
    }
    
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteBookById(@PathVariable("id") Long bookId){
    	booksService.deleteBookById(bookId);
        return ResponseEntity.noContent().build();

    }
}

