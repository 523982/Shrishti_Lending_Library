import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import BookCard from '../pages/BookCard';
import '../pages/BookList.css'; // CSS for the grid layout

const BookList = () => {
    const [books, setBooks] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                // Assuming you have a '/books' endpoint
                const response = await apiClient.get('/books');
                setBooks(response.data);
            } catch (err) {
                console.error("Error fetching books:", err);
                setError("Could not fetch the book collection.");
            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
    }, []);

    return (
        <div className="book-list-container">
            <h2>Our Collection</h2>
            {loading && <div>Loading books...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <div className="book-list">
                {!loading && !error && books.map(book => (
                    <BookCard key={book.bookId} book={book} />
                ))}
            </div>
        </div>
    );
};

export default BookList;

