import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalBooks: 0,
        booksOnLoan: 0, // You can fetch this data as well
        activeMembers: 0, // You can fetch this data as well
        communities:0
    });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch book count and transactions in parallel
                const [countResponse, custResponse,communityResponse,transactionsResponse] = await Promise.all([
                    apiClient.get('/books/count'),
                    apiClient.get('/customers/count'),
                    apiClient.get('/communities/count'),
                    apiClient.get('/transactions/latest') // Endpoint for transactions
                ]);

                 // Update stats with the fetched book count and hardcoded values
                 const bookCounts = countResponse.data; // e.g., { totalBooks: 150, booksOnLoan: 35 }
                    const custCount=custResponse.data;
                    const commCount=communityResponse.data;
                // Update stats with the fetched book count and hardcoded values
                setStats(prevStats => ({
                    ...prevStats,
                    totalBooks: bookCounts.totalBooks,
                    booksOnLoan: bookCounts.booksOnLoan,
                    activeMembers: custCount, // This can be replaced when an endpoint is available
                    communities:commCount
                }));

                // Update transactions
                setTransactions(transactionsResponse.data);

            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("Could not fetch dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []); // Empty dependency array ensures this runs only once on mount

    if (loading) {
        return <div className="admin-dashboard"><h1>Admin Dashboard</h1><p>Loading dashboard data...</p></div>;
    }

    if (error) {
        return <div className="admin-dashboard"><h1>Admin Dashboard</h1><p style={{ color: 'red' }}>{error}</p></div>;
    }

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            <div className="stats-grid">
                <div className="stat-card">
                    <h2>{stats.totalBooks || 0}</h2>
                    <p>Total Books</p>
                </div>
                <div className="stat-card">
                    <h2>{stats.booksOnLoan || 0}</h2>
                    <p>Books on Loan</p>
                </div>
                <div className="stat-card">
                    <h2>{stats.activeMembers || 0}</h2>
                    <p>Active Members</p>
                </div>
                <div className="stat-card">
                    <h2>{stats.communities || 0}</h2>
                    <p>Communities</p>
                </div>
            </div>

            <div className="dashboard-section">
                <h2>Admin Actions</h2>
                <div className="action-buttons">
                    <Link to="/admin/books" className="action-button">Manage Books</Link>
                    <Link to="/admin/customers" className="action-button">Manage Customers</Link>
                    <Link to="/admin/add-community" className="action-button">Manage Community</Link>
                    <Link to="/admin/reports" className="action-button">Reports</Link>
                </div>
            </div>

            <div className="dashboard-section">
                <h2>Recent Transactions</h2>
                {transactions.length > 0 ? (
                    <ul className="transaction-list">
                        {transactions.map(txn => (
                            <li key={txn.transactionId}>
                                <span className="txn-book">{txn.bookName}</span>
                                <span className="txn-user">by {txn.customerName}</span>
                                {txn.pickupDate && <span className="txn-date"> on {new Date(txn.pickupDate).toLocaleDateString()}</span>}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No transactions found.</p>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;

