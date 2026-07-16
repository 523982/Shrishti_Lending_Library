import React, { useMemo, useState, useEffect } from 'react';
import apiClient, { API_BASE_URL } from '../services/api';
import BookCard from '../pages/BookCard';
import '../pages/BookList.css'; // CSS for the grid layout

const getStatusId = (book) => book.bookstatus?.statusId || book.bookStatus?.statusId || book.statusId;

const getStatusName = (book) => String(
    book.bookstatus?.statusDesc ||
    book.bookstatus?.statusName ||
    book.bookStatus?.statusDesc ||
    book.bookStatus?.statusName ||
    book.status ||
    ''
).toLowerCase();

const isAvailableBook = (book) => Number(getStatusId(book)) === 1 || getStatusName(book) === 'available';

const isObsoleteBook = (book) => {
    return Number(getStatusId(book)) === 6 || getStatusName(book) === 'obsolete';
};

const getBookGenre = (book) => {
    const genre = String(book.genre || '').trim();
    return genre || 'Uncategorized';
};

const getBooksApiErrorMessage = (err) => {
    const booksEndpoint = `${API_BASE_URL}/books`;

    if (err.response) {
        const detail = err.response.data?.message || err.response.data?.error || err.response.statusText;
        return `Failed to load books. ${booksEndpoint} returned ${err.response.status}${detail ? `: ${detail}` : ''}.`;
    }

    if (err.request) {
        return `Failed to load books. Could not reach ${booksEndpoint}. Check Render deploy status and CORS for this Vercel site.`;
    }

    return `Failed to load books. ${err.message || 'Unexpected API error.'}`;
};

const BookList = () => {
    const [books, setBooks] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [genreFilter, setGenreFilter] = useState('all');
    const [availabilityFilter, setAvailabilityFilter] = useState('available');

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                // Assuming you have a '/books' endpoint
                const response = await apiClient.get('/books');
                const apiBooks = Array.isArray(response.data) ? response.data : [];
                const visibleBooks = apiBooks.filter(book => !isObsoleteBook(book));
                setBooks(visibleBooks);
                setError(apiBooks.length === 0 ? 'No books found in inventory.' : null);
            } catch (err) {
                console.error("Error fetching books:", err);
                setBooks([]);
                setError(getBooksApiErrorMessage(err));
            } finally {
                setLoading(false);
            }
        };

        fetchBooks();
    }, []);

    const genres = useMemo(() => {
        const uniqueGenres = new Set(books.map(getBookGenre));
        return Array.from(uniqueGenres).sort((a, b) => a.localeCompare(b));
    }, [books]);

    const filteredBooks = useMemo(() => books.filter((book) => {
        const matchesGenre = genreFilter === 'all' || getBookGenre(book) === genreFilter;
        const matchesAvailability = availabilityFilter === 'all' ||
            (availabilityFilter === 'available' && isAvailableBook(book)) ||
            (availabilityFilter === 'unavailable' && !isAvailableBook(book));

        return matchesGenre && matchesAvailability;
    }), [books, genreFilter, availabilityFilter]);

    const handleResetFilters = () => {
        setGenreFilter('all');
        setAvailabilityFilter('available');
    };

    return (
        <div className="book-list-container">
            <div className="collection-header">
                <div>
                    <h2>Our Collection</h2>
                    {!loading && !error && (
                        <p>
                            Showing {filteredBooks.length} of {books.length} books
                        </p>
                    )}
                </div>
                <div className="book-filters" aria-label="Book filters">
                    <label>
                        Genre
                        <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)}>
                            <option value="all">All Genres</option>
                            {genres.map(genre => (
                                <option key={genre} value={genre}>{genre}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Availability
                        <select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)}>
                            <option value="available">Available Only</option>
                            <option value="all">All Books</option>
                            <option value="unavailable">Unavailable / Other</option>
                        </select>
                    </label>
                    <button type="button" onClick={handleResetFilters}>Reset</button>
                </div>
            </div>
            {loading && <div>Loading books...</div>}
            {error && <div className="api-error-message">{error}</div>}
            {!loading && !error && filteredBooks.length === 0 && (
                <div className="no-books-message">No books match the selected filters.</div>
            )}
            <div className="book-list">
                {!loading && !error && filteredBooks.map(book => (
                    <BookCard key={book.bookId} book={book} />
                ))}
            </div>
        </div>
    );
};

export default BookList;

