import React from 'react';
import { Link } from 'react-router-dom';
import './BookCard.css'; 

const BookCard = ({ book }) => {
    const coverImage = book.imageUrl || book.coverImageUrl;
    const fallbackInitial = String(book.bookName || 'B').trim().charAt(0).toUpperCase() || 'B';
    const statusName = book.bookstatus?.statusName || book.bookstatus?.statusDesc || book.bookstatus || 'N/A';
    const isAvailable = statusName.toLowerCase() === 'available';
    const statusText = isAvailable ? 'Available' : 'Unavailable';
    const statusClassName = isAvailable ? 'status-available' : 'status-unavailable';
    return (
        <Link to={`/books/${book.bookId}`} className="book-card-link">
            <div className="book-card">
            {coverImage ? (
                <img src={coverImage} alt={`${book.bookName} cover`} className="book-card-cover" />
            ) : (
                <div className="book-card-cover book-card-cover-placeholder" aria-hidden="true">
                    <span>{fallbackInitial}</span>
                </div>
            )}
            <div className="book-card-info">
                <h3 className="book-card-title">{book.bookName}</h3>
                <p className="book-card-author">by {book.author}</p>
                {book.genre && <p className="book-card-genre">{book.genre}</p>}
                <p className="book-card-lcost"> Lending Cost: Rs. {book.lendingCost}</p>
                {/*<span className="book-card-status"> {book.status}                 </span>*/}
                <span className={`status-badge ${statusClassName}`}>{statusText}</span>

            </div>
        </div>
        </Link>
    );
};

export default BookCard;
