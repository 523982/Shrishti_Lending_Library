package com.library.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.library.dto.BookCountStatsDTO;
import com.library.dto.BookStatusDTO;
import com.library.dto.BooksDTO;
import com.library.enums.BookStatusEnum;
import com.library.exception.ResourceNotFoundException;
import com.library.model.BookStatus;
import com.library.model.Books;
import com.library.repository.BooksRepository;
import com.library.repository.BooksStatusRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;

@Service
public class BooksService {
	
	    private final BooksRepository booksRepository;
	    
	    private final BooksStatusRepository booksStatusRepository;
	    
	    @Autowired
	    public BooksService(BooksRepository booksRepository,BooksStatusRepository booksStatusRepository) {
			super();
			this.booksRepository = booksRepository;
			this.booksStatusRepository=booksStatusRepository;
		}
	    

		public List<BooksDTO> getAllBooks() {
			 return booksRepository.findByStatusIdNot(6L)
                     .stream()
                     .map(this::convertToDto)
                     .collect(Collectors.toList());
	        
	    }
		
		public BookCountStatsDTO getBookCountStats() {
	        // Get the total count of all books from the repository.
	        long totalBooks = booksRepository.count();

	        // Get the count of only the unavailable books.
	        long booksOnLoan = booksRepository.countUnavailableBooks();

	        // Create and return the DTO.
	        return new BookCountStatsDTO(totalBooks, booksOnLoan);
	    }
		
		@Transactional
	    public BooksDTO addBooks(Books books) {
		    BookStatus bookStatus= getOrCreateBookStatus(1L, BookStatusEnum.AVAILABLE);
	    	books.setBookId(getNextBookId());
	    	books.setBookStatus(bookStatus);
	        Books savedBook= booksRepository.save(books);
	        return convertToDto(savedBook);
	    }

	    public Books getBooksById(Long bookId) {
	        return booksRepository.findById(bookId)
	                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));
	    }
	    
	    public List<Books> searchBooks(String query) {
	        return booksRepository.findByBookNameContainingIgnoreCase(query);
	    }
	    
	    public List<Books> searchLentBooks(String query) {
	        return booksRepository.lentBooks(query);
	    }
	    
	    public Books updateBook(Long bookId, Books bookDetails) {
	        Books existingBook = booksRepository.findById(bookId)
	                .orElseThrow(() -> new EntityNotFoundException("Book not found with id: " + bookId));
	        
		    BookStatus bookStatus= getOrCreateBookStatus(1L, BookStatusEnum.AVAILABLE);

	        // Update fields from the payload
	        existingBook.setBookName(bookDetails.getBookName());
	        existingBook.setAuthor(bookDetails.getAuthor());
	        existingBook.setGenre(bookDetails.getGenre());
	        existingBook.setPurchasePrice(bookDetails.getPurchasePrice());
	        existingBook.setPurchaseDate(bookDetails.getPurchaseDate());
	        existingBook.setLendingCost(bookDetails.getLendingCost());
	        existingBook.setImageUrl(bookDetails.getImageUrl());
	        if (bookDetails.getBookStatus()==null){
	        existingBook.setBookStatus(bookStatus);
	        }
	        // Do not update status or other fields that aren't in the form

	        return booksRepository.save(existingBook);
	    }
	    
	    public void deleteBookById(Long bookId) {
	    	 if (!booksRepository.existsById(bookId)) {
	    	        throw new EntityNotFoundException("Book not found with id: " + bookId);
	    	    }
	    	booksRepository.deleteById(bookId);
	    }
	    
	    public BooksDTO removeBook(Long bookId) {
	    	 Books book= booksRepository.findById(bookId)
	    			 .orElseThrow(() -> new EntityNotFoundException("Book not found with id: " + bookId));; 
	    	 //BooksDTO request= convertToDto(getBooksById(bookId));
	    	 BookStatus status= getOrCreateBookStatus(6L, BookStatusEnum.OBSOLETE);
	    	 book.setBookStatus(status);
	    	return convertToDto(booksRepository.save(book));
	    }

	    private Long getNextBookId() {
	    	Long maxBookId = booksRepository.findMaxBookId();
	    	return maxBookId == null ? 1L : maxBookId + 1;
	    }

	    private BookStatus getOrCreateBookStatus(Long statusId, BookStatusEnum statusDesc) {
	    	return booksStatusRepository.findById(statusId).orElseGet(() -> {
	    		BookStatus status = new BookStatus();
	    		status.setStatusId(statusId);
	    		status.setStatusDesc(statusDesc);
	    		return booksStatusRepository.save(status);
	    	});
	    }

	    
	    private BooksDTO convertToDto(Books book) {
	        BooksDTO dto = new BooksDTO();
	        dto.setBookId(book.getBookId());
	        dto.setBookName(book.getBookName());
	        dto.setAuthor(book.getAuthor());
	        dto.setGenre(book.getGenre());
	        dto.setLendingCost(book.getLendingCost());
	        dto.setPurchaseDate(book.getPurchaseDate());
	        dto.setImageUrl(book.getImageUrl());

	        
	        // Safely convert the nested BookStatus entity to its DTO
	        if (book.getBookStatus() != null) {
	            BookStatusDTO statusDto = new BookStatusDTO();
	            statusDto.setStatusId(book.getBookStatus().getStatusId());
	            statusDto.setStatusDesc(book.getBookStatus().getStatusDesc());
	            dto.setBookstatus(statusDto);
	        }
	        // This is the crucial part:
	        // We safely access the related entity and pull out just the data we need.
	        if (book.getBookStatus() != null) {
	            dto.getBookstatus().setStatusDesc(book.getBookStatus().getStatusDesc());

	        }
	        
	        return dto;
	}
}
