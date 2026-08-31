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

const BOOKS_CACHE_KEY = `shrishti.books.cache.v1:${API_BASE_URL}`;

const getCacheTimeLabel = (cachedAt) => {
    if (!cachedAt) return '';

    const elapsedMs = Date.now() - cachedAt;
    if (elapsedMs < 60_000) return 'less than a minute ago';

    const elapsedMinutes = Math.floor(elapsedMs / 60_000);
    if (elapsedMinutes < 60) {
        return `${elapsedMinutes} minute${elapsedMinutes === 1 ? '' : 's'} ago`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) {
        return `${elapsedHours} hour${elapsedHours === 1 ? '' : 's'} ago`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);
    return `${elapsedDays} day${elapsedDays === 1 ? '' : 's'} ago`;
};

const getSavedBooksNotice = (cachedAt, suffix) => {
    const timeLabel = getCacheTimeLabel(cachedAt);
    return `Showing saved books${timeLabel ? ` from ${timeLabel}` : ''}. ${suffix}`;
};

const removeLargeInlineImagesForCache = (book) => ({
    ...book,
    imageUrl: typeof book.imageUrl === 'string' && book.imageUrl.startsWith('data:') ? '' : book.imageUrl,
    coverImageUrl: typeof book.coverImageUrl === 'string' && book.coverImageUrl.startsWith('data:') ? '' : book.coverImageUrl,
});

const readCachedBooks = () => {
    try {
        const rawCache = window.localStorage.getItem(BOOKS_CACHE_KEY);
        if (!rawCache) return null;

        const cache = JSON.parse(rawCache);
        if (!Array.isArray(cache.books)) return null;

        return {
            books: cache.books,
            cachedAt: Number(cache.cachedAt) || null,
        };
    } catch (err) {
        console.warn('Could not read cached books:', err);
        return null;
    }
};

const saveCachedBooks = (books) => {
    try {
        const lightweightBooks = books.map(removeLargeInlineImagesForCache);
        window.localStorage.setItem(BOOKS_CACHE_KEY, JSON.stringify({
            books: lightweightBooks,
            cachedAt: Date.now(),
        }));
    } catch (err) {
        console.warn('Could not save cached books:', err);
    }
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
    const [cacheNotice, setCacheNotice] = useState(null);
    const [isShowingCachedBooks, setIsShowingCachedBooks] = useState(false);
    const [loading, setLoading] = useState(true);
    const [genreFilter, setGenreFilter] = useState('all');
    const [availabilityFilter, setAvailabilityFilter] = useState('available');

    useEffect(() => {
        let didCancel = false;

        const fetchBooks = async () => {
            const cached = readCachedBooks();
            if (cached?.books?.length) {
                setBooks(cached.books);
                setIsShowingCachedBooks(true);
                setCacheNotice(getSavedBooksNotice(cached.cachedAt, 'Updating...'));
                setLoading(false);
            }

            try {
                // Assuming you have a '/books' endpoint
                const response = await apiClient.get('/books');
                if (didCancel) return;

                const apiBooks = Array.isArray(response.data) ? response.data : [];
                const visibleBooks = apiBooks.filter(book => !isObsoleteBook(book));
                setBooks(visibleBooks);
                setIsShowingCachedBooks(false);
                setCacheNotice('Updated just now.');
                setError(apiBooks.length === 0 ? 'No books found in inventory.' : null);
                saveCachedBooks(visibleBooks);
            } catch (err) {
                if (didCancel) return;

                console.error("Error fetching books:", err);
                if (cached?.books?.length) {
                    setError(null);
                    setIsShowingCachedBooks(true);
                    setCacheNotice(getSavedBooksNotice(cached.cachedAt, 'Live update is not available right now.'));
                } else {
                    setBooks([]);
                    setCacheNotice(null);
                    setError(getBooksApiErrorMessage(err));
                }
            } finally {
                if (!didCancel) {
                    setLoading(false);
                }
            }
        };

        fetchBooks();

        return () => {
            didCancel = true;
        };
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
                    {cacheNotice && (
                        <p className={`cache-status-note ${isShowingCachedBooks ? 'cached' : 'fresh'}`}>
                            {cacheNotice}
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

