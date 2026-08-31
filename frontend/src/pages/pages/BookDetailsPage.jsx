import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // We'll need react-router-dom for this
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';
import './BookDetailsPage.css';

const BookDetailsPage = () => {
    const { bookId } = useParams(); // Gets the 'bookId' from the URL (e.g., /books/123)
    const navigate = useNavigate();
    const { userRole } = useAuth();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBook = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`/books/${bookId}`);
                if (response.data) {
                    setBook(response.data);
                    setError(null);
                } else {
                    setBook(null);
                    setError("Could not find the requested book.");
                }
            } catch (err) {
                console.error("Error fetching book details:", err);
                setBook(null);
                setError("Failed to load book details from the inventory API.");
            } finally {
                setLoading(false);
            }
        };

        fetchBook();
    }, [bookId]); // Re-run the effect if the bookId changes

    if (loading) return <div>Loading book details...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;
    if (!book) return <div>Book not found.</div>;

    const coverImage = book.imageUrl || book.coverImageUrl;
    const fallbackInitial = String(book.bookName || 'B').trim().charAt(0).toUpperCase() || 'B';
    const statusDesc = String(
        book.bookstatus?.statusDesc ||
        book.bookstatus?.statusName ||
        book.bookStatus?.statusDesc ||
        book.bookStatus?.statusName ||
        book.bookStatus ||
        book.status ||
        ''
    ).toLowerCase();
    const isAvailable = statusDesc === 'available';
    const isOnLoan = statusDesc === 'unavailable' || statusDesc === 'on loan';
    const isAdmin = userRole === 'admin';
    const handleAdminBookAction = () => {
        if (isAvailable) {
            navigate('/admin/books', {
                state: {
                    adminBookAction: 'lend',
                    book,
                },
            });
            return;
        }

        navigate('/admin/books', {
            state: {
                adminBookAction: 'return',
                book,
            },
        });
    };

 return (
        <div className="book-details-container">
            <Link to="/browse" className="back-link">&larr; Back to Browse</Link>
            <div className="book-details-content">
                {coverImage ? (
                    <img src={coverImage} alt={`${book.bookName} cover`} className="book-details-cover" />
                ) : (
                    <div className="book-details-cover book-details-cover-placeholder" aria-hidden="true">
                        <span>{fallbackInitial}</span>
                    </div>
                )}
                <div className="book-details-info">
                    <h1>{book.bookName}</h1>
                    <h3>by {book.author}</h3>
                    {/* <p className="book-details-description">{book.description || "No description available."}</p> */}
                    <span className={`book-details-status ${isAvailable ? 'available' : 'unavailable'}`}>
                        {isAvailable ? 'Available' : 'On Loan'}
                    </span>
                    {isAdmin && (isAvailable || isOnLoan) && (
                        <button className={`borrow-button ${isOnLoan ? 'return-button' : ''}`} onClick={handleAdminBookAction}>
                            {isAvailable ? 'Borrow This Book' : 'Return Book'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookDetailsPage;

