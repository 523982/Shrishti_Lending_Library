import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../services/api';
import './Reports.css';

const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const todayInput = () => new Date().toISOString().split('T')[0];

const monthStartInput = (date = new Date()) => {
    const value = new Date(date.getFullYear(), date.getMonth(), 1);
    return value.toISOString().split('T')[0];
};

const lastMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);

    return {
        from: start.toISOString().split('T')[0],
        to: end.toISOString().split('T')[0],
    };
};

const toNumber = (value) => Number(value) || 0;

const inRange = (dateValue, from, to) => {
    if (!dateValue) return false;

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return false;

    if (from && date < new Date(from)) return false;
    if (to && date > new Date(`${to}T23:59:59`)) return false;

    return true;
};

const getTransactionDate = (transaction) => transaction.returnDate || transaction.pickupDate;

const sortByAmount = (items, key = 'amount') => [...items].sort((a, b) => b[key] - a[key]);

const Reports = () => {
    const [periodMode, setPeriodMode] = useState('all');
    const [customRange, setCustomRange] = useState({
        from: monthStartInput(),
        to: todayInput(),
    });
    const [transactions, setTransactions] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [booksById, setBooksById] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReportsData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [transactionsResponse, customersResponse, communitiesResponse] = await Promise.all([
                    apiClient.get('/transactions'),
                    apiClient.get('/customers'),
                    apiClient.get('/communities'),
                ]);

                const transactionData = Array.isArray(transactionsResponse.data) ? transactionsResponse.data : [];
                setTransactions(transactionData);
                setCustomers(Array.isArray(customersResponse.data) ? customersResponse.data : []);
                setCommunities(Array.isArray(communitiesResponse.data) ? communitiesResponse.data : []);

                const uniqueBookIds = [...new Set(transactionData.map(txn => txn.bookId).filter(Boolean))];
                const bookEntries = await Promise.all(
                    uniqueBookIds.map(async (bookId) => {
                        try {
                            const response = await apiClient.get(`/books/${bookId}`);
                            return [bookId, response.data];
                        } catch (bookError) {
                            console.warn(`Unable to load book ${bookId} for reports`, bookError);
                            return [bookId, null];
                        }
                    })
                );

                setBooksById(Object.fromEntries(bookEntries.filter(([, book]) => book)));
            } catch (err) {
                console.error('Error fetching reports data:', err);
                setError('Could not fetch reports data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchReportsData();
    }, []);

    const selectedRange = useMemo(() => {
        if (periodMode === 'all') {
            return { from: '', to: '' };
        }

        if (periodMode === 'thisMonth') {
            return { from: monthStartInput(), to: todayInput() };
        }

        if (periodMode === 'lastMonth') {
            return lastMonthRange();
        }

        return customRange;
    }, [customRange, periodMode]);

    const report = useMemo(() => {
        const customerById = Object.fromEntries(customers.map(customer => [customer.customerId, customer]));
        const communityById = Object.fromEntries(communities.map(community => [community.communityId, community]));

        const filteredTransactions = transactions.filter(transaction => {
            if (periodMode === 'all') return true;
            return inRange(getTransactionDate(transaction), selectedRange.from, selectedRange.to);
        });

        const totals = filteredTransactions.reduce((acc, transaction) => {
            const totalAmount = toNumber(transaction.totalAmount);
            const amountPaid = toNumber(transaction.amountPaid);
            const pending = Math.max(0, totalAmount - amountPaid);

            acc.billed += totalAmount;
            acc.collected += amountPaid;
            acc.pending += pending;
            acc.transactions += 1;
            if (transaction.returnDate) acc.returned += 1;
            if (!transaction.returnDate) acc.active += 1;

            return acc;
        }, {
            billed: 0,
            collected: 0,
            pending: 0,
            transactions: 0,
            returned: 0,
            active: 0,
        });

        const uniqueBookIds = [...new Set(filteredTransactions.map(transaction => transaction.bookId).filter(Boolean))];
        const transactedBookCost = uniqueBookIds.reduce((sum, bookId) => {
            const book = booksById[bookId];
            return sum + toNumber(book?.purchasePrice);
        }, 0);

        const bookMap = new Map();
        const communityMap = new Map();
        const duesRows = [];

        filteredTransactions.forEach(transaction => {
            const totalAmount = toNumber(transaction.totalAmount);
            const amountPaid = toNumber(transaction.amountPaid);
            const pending = Math.max(0, totalAmount - amountPaid);
            const isSubscription = Boolean(transaction.subscriptionTxnId);
            const bookRevenueAmount = transaction.bookRevenueAmount == null
                ? totalAmount
                : toNumber(transaction.bookRevenueAmount);
            const book = booksById[transaction.bookId];

            if (!bookMap.has(transaction.bookId)) {
                bookMap.set(transaction.bookId, {
                    bookId: transaction.bookId,
                    bookName: transaction.bookName || 'Unknown Book',
                    author: book?.author || '',
                    timesLent: 0,
                    billed: 0,
                    collected: 0,
                    pending: 0,
                    purchasePrice: toNumber(book?.purchasePrice),
                });
            }

            const bookRow = bookMap.get(transaction.bookId);
            bookRow.timesLent += 1;
            bookRow.billed += bookRevenueAmount;
            bookRow.collected += isSubscription ? bookRevenueAmount : amountPaid;
            bookRow.pending += isSubscription ? 0 : pending;

            const customer = customerById[transaction.customerId];
            const community = customer?.community || communityById[customer?.communityId];
            const communityKey = community?.communityId || 'unknown';

            if (!communityMap.has(communityKey)) {
                communityMap.set(communityKey, {
                    communityId: communityKey,
                    communityName: community?.communityName || 'Unknown Community',
                    transactions: 0,
                    billed: 0,
                    collected: 0,
                    pending: 0,
                    activeCustomers: new Set(),
                });
            }

            const communityRow = communityMap.get(communityKey);
            communityRow.transactions += 1;
            communityRow.billed += totalAmount;
            communityRow.collected += amountPaid;
            communityRow.pending += pending;
            if (transaction.customerId) communityRow.activeCustomers.add(transaction.customerId);

            if (pending > 0) {
                duesRows.push({
                    transactionId: transaction.transactionId,
                    customerName: transaction.customerName,
                    bookName: transaction.bookName,
                    pickupDate: transaction.pickupDate,
                    billed: totalAmount,
                    paid: amountPaid,
                    pending,
                });
            }
        });

        const bookPerformance = sortByAmount([...bookMap.values()].map(book => ({
            ...book,
            roi: book.billed - book.purchasePrice,
        })), 'billed');

        const communityPerformance = sortByAmount([...communityMap.values()].map(community => ({
            ...community,
            activeCustomerCount: community.activeCustomers.size,
        })), 'billed');

        return {
            totals: {
                ...totals,
                transactedBookCost,
                netAfterBookCost: totals.billed - transactedBookCost,
                collectionRate: totals.billed > 0 ? (totals.collected / totals.billed) * 100 : 0,
            },
            bookPerformance,
            communityPerformance,
            duesRows: sortByAmount(duesRows, 'pending'),
        };
    }, [booksById, communities, customers, periodMode, selectedRange, transactions]);

    if (loading) {
        return <div className="reports-page"><h1>Reports</h1><p>Loading reports...</p></div>;
    }

    if (error) {
        return <div className="reports-page"><h1>Reports</h1><p className="reports-error">{error}</p></div>;
    }

    return (
        <div className="reports-page">
            <div className="reports-header">
                <div>
                    <h1>Reports</h1>
                    <p>Business view based on lending transactions and payments captured so far.</p>
                </div>
                <div className="period-controls">
                    <select value={periodMode} onChange={(event) => setPeriodMode(event.target.value)}>
                        <option value="all">All Time</option>
                        <option value="thisMonth">This Month</option>
                        <option value="lastMonth">Last Month</option>
                        <option value="custom">Custom</option>
                    </select>
                    {periodMode === 'custom' && (
                        <>
                            <input
                                type="date"
                                value={customRange.from}
                                onChange={(event) => setCustomRange(prev => ({ ...prev, from: event.target.value }))}
                            />
                            <input
                                type="date"
                                value={customRange.to}
                                onChange={(event) => setCustomRange(prev => ({ ...prev, to: event.target.value }))}
                            />
                        </>
                    )}
                </div>
            </div>

            <section className="metric-grid">
                <div className="metric-card">
                    <span>Billed Revenue</span>
                    <strong>{currency.format(report.totals.billed)}</strong>
                </div>
                <div className="metric-card">
                    <span>Collected</span>
                    <strong>{currency.format(report.totals.collected)}</strong>
                </div>
                <div className="metric-card">
                    <span>Pending Dues</span>
                    <strong>{currency.format(report.totals.pending)}</strong>
                </div>
                <div className="metric-card">
                    <span>Collection Rate</span>
                    <strong>{report.totals.collectionRate.toFixed(0)}%</strong>
                </div>
                <div className="metric-card">
                    <span>Book Cost Used</span>
                    <strong>{currency.format(report.totals.transactedBookCost)}</strong>
                </div>
                <div className="metric-card">
                    <span>Estimated Net</span>
                    <strong>{currency.format(report.totals.netAfterBookCost)}</strong>
                </div>
            </section>

            <section className="reports-split">
                <div className="report-panel">
                    <h2>Library Health</h2>
                    <div className="health-grid">
                        <div>
                            <span>Transactions</span>
                            <strong>{report.totals.transactions}</strong>
                        </div>
                        <div>
                            <span>Returned</span>
                            <strong>{report.totals.returned}</strong>
                        </div>
                        <div>
                            <span>Active Loans</span>
                            <strong>{report.totals.active}</strong>
                        </div>
                    </div>
                </div>

                <div className="report-panel">
                    <h2>Top Communities</h2>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Community</th>
                                    <th>Txns</th>
                                    <th>Billed</th>
                                    <th>Pending</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.communityPerformance.slice(0, 5).map(community => (
                                    <tr key={community.communityId}>
                                        <td>{community.communityName}</td>
                                        <td>{community.transactions}</td>
                                        <td>{currency.format(community.billed)}</td>
                                        <td>{currency.format(community.pending)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <section className="report-panel">
                <h2>Book Performance</h2>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Book</th>
                                <th>Lent</th>
                                <th>Billed</th>
                                <th>Collected</th>
                                <th>Pending</th>
                                <th>ROI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.bookPerformance.slice(0, 10).map(book => (
                                <tr key={book.bookId}>
                                    <td>
                                        <strong>{book.bookName}</strong>
                                        {book.author && <span className="table-subtext">by {book.author}</span>}
                                    </td>
                                    <td>{book.timesLent}</td>
                                    <td>{currency.format(book.billed)}</td>
                                    <td>{currency.format(book.collected)}</td>
                                    <td>{currency.format(book.pending)}</td>
                                    <td>{currency.format(book.roi)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="report-panel">
                <h2>Pending Dues</h2>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Book</th>
                                <th>Pickup</th>
                                <th>Billed</th>
                                <th>Paid</th>
                                <th>Due</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.duesRows.slice(0, 10).map(row => (
                                <tr key={row.transactionId}>
                                    <td>{row.customerName}</td>
                                    <td>{row.bookName}</td>
                                    <td>{row.pickupDate ? new Date(row.pickupDate).toLocaleDateString() : '-'}</td>
                                    <td>{currency.format(row.billed)}</td>
                                    <td>{currency.format(row.paid)}</td>
                                    <td>{currency.format(row.pending)}</td>
                                </tr>
                            ))}
                            {report.duesRows.length === 0 && (
                                <tr>
                                    <td colSpan="6">No pending dues for this period.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default Reports;
