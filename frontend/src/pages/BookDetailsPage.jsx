import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // We'll need react-router-dom for this
import apiClient from '../services/api';
import './BookDetailsPage.css';

const BookDetailsPage = () => {
    const { bookId } = useParams(); // Gets the 'bookId' from the URL (e.g., /books/123)
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBook = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`/books/${bookId}`);
                setBook(response.data);
            } catch (err) {
                console.error("Error fetching book details:", err);
                setError("Could not find the requested book.");
            } finally {
                setLoading(false);
            }
        };

        fetchBook();
    }, [bookId]); // Re-run the effect if the bookId changes

    if (loading) return <div>Loading book details...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;
    if (!book) return <div>Book not found.</div>;

    const coverImage = book.coverImageUrl || 'https://via.placeholder.com/300x400.png?text=No+Cover';
    const statusDesc = book.bookStatus?.statusDesc || book.bookStatus; // Safely access nested property
    const isAvailable = typeof statusDesc === 'string' && statusDesc.toLowerCase() === 'available';
 return (
        <div className="book-details-container">
            <Link to="/browse" className="back-link">&larr; Back to Browse</Link>
            <div className="book-details-content">
                <img src={coverImage} alt={`${book.bookName}`} className="book-details-cover" />
                <div className="book-details-info">
                    <h1>{book.bookName}</h1>
                    <h3>by {book.author}</h3>
                    {/* <p className="book-details-description">{book.description || "No description available."}</p> */}
                    <span className={`book-details-status ${isAvailable ? 'available' : 'unavailable'}`}>
                        {isAvailable ? 'Available' : 'On Loan'}
                    </span>
                    <button className="borrow-button" disabled={!isAvailable}>
                        {isAvailable ? 'Borrow This Book' : 'Currently Unavailable'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookDetailsPage;

