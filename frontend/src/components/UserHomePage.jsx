import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import './UserHomePage.css';

const getStatusName = (book) => String(
    book.bookstatus?.statusDesc ||
    book.bookstatus?.statusName ||
    book.bookStatus?.statusDesc ||
    book.bookStatus?.statusName ||
    book.status ||
    ''
).toLowerCase();

const isAvailableBook = (book) => {
    const statusId = book.bookstatus?.statusId || book.bookStatus?.statusId || book.statusId;
    return Number(statusId) === 1 || getStatusName(book) === 'available';
};

const UserHomePage = () => {
    const [stats, setStats] = useState({
        totalBooks: 0,
        availableBooks: 0,
        communities: 0,
    });

    useEffect(() => {
        const fetchGuestStats = async () => {
            try {
                const [booksResponse, communitiesResponse] = await Promise.all([
                    apiClient.get('/books'),
                    apiClient.get('/communities/count'),
                ]);
                const books = Array.isArray(booksResponse.data) ? booksResponse.data : [];

                setStats({
                    totalBooks: books.length,
                    availableBooks: books.filter(isAvailableBook).length,
                    communities: Number(communitiesResponse.data) || 0,
                });
            } catch (err) {
                console.error('Error fetching guest home stats:', err);
            }
        };

        fetchGuestStats();
    }, []);

    return (
        <div className="page-container home-page">
            <h1 className="welcome-title">"There is no friend as loyal as a book"</h1>
            <p className="welcome-subtitle">Browse our collection to find your next favorite book.</p>
            <div className="guest-stats" aria-label="Library summary">
                <div className="guest-stat">
                    <strong>{stats.availableBooks}</strong>
                    <span>Available Books</span>
                </div>
                <div className="guest-stat">
                    <strong>{stats.totalBooks}</strong>
                    <span>Books to Browse</span>
                </div>
                <div className="guest-stat">
                    <strong>{stats.communities}</strong>
                    <span>Communities Served</span>
                </div>
            </div>
            <Link to="/browse" className="browse-cta">Browse Books</Link>
        </div>
    );
};

export default UserHomePage;

