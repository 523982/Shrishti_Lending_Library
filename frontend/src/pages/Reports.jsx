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

const chartColors = ['#2563eb', '#16a34a', '#f59e0b', '#db2777', '#64748b'];
const REPORT_PREVIEW_LIMIT = 10;

const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const getOfferLabel = (transaction) => {
    if (transaction.subscriptionTxnId) {
        return `Subscription ${transaction.bundleBookNo || '-'} / ${transaction.bundleBookLimit || '-'}`;
    }
    if (transaction.offerName) {
        return transaction.offerName;
    }
    return 'Normal';
};

const compareValues = (a, b, type = 'text') => {
    if (type === 'number') {
        return toNumber(a) - toNumber(b);
    }

    if (type === 'date') {
        const aTime = a ? new Date(a).getTime() : 0;
        const bTime = b ? new Date(b).getTime() : 0;
        return (Number.isNaN(aTime) ? 0 : aTime) - (Number.isNaN(bTime) ? 0 : bTime);
    }

    return String(a || '').localeCompare(String(b || ''), undefined, {
        numeric: true,
        sensitivity: 'base',
    });
};

const sortRows = (rows, columns, sortConfig) => {
    const column = columns.find(item => item.key === sortConfig.key);
    if (!column) return rows;

    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
        const aValue = column.sortValue ? column.sortValue(a) : a[column.key];
        const bValue = column.sortValue ? column.sortValue(b) : b[column.key];
        return compareValues(aValue, bValue, column.type) * direction;
    });
};

const nextSortConfig = (current, key) => {
    if (current.key === key) {
        return {
            key,
            direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
    }

    return { key, direction: 'asc' };
};

const escapeCsvValue = (value) => {
    if (value === null || value === undefined) return '';
    const text = String(value).replace(/\r?\n|\r/g, ' ');
    return /[",]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadCsv = (fileName, columns, rows) => {
    const csvRows = [
        columns.map(column => escapeCsvValue(column.label)).join(','),
        ...rows.map(row => columns.map(column => {
            const value = column.exportValue
                ? column.exportValue(row)
                : column.sortValue
                    ? column.sortValue(row)
                    : row[column.key];
            return escapeCsvValue(value);
        }).join(',')),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const SortHeader = ({ column, sortConfig, onSort }) => {
    const isActive = sortConfig.key === column.key;
    const directionLabel = isActive && sortConfig.direction === 'asc' ? 'Asc' : 'Desc';

    return (
        <th>
            <button
                type="button"
                className={`sort-header${isActive ? ' active' : ''}`}
                onClick={() => onSort(column.key)}
            >
                <span>{column.label}</span>
                <span aria-hidden="true">{isActive ? directionLabel : 'Sort'}</span>
            </button>
        </th>
    );
};

const ReportTable = ({ columns, rows, sortConfig, onSort, emptyMessage }) => (
    <div className="table-wrap">
        <table>
            <thead>
                <tr>
                    {columns.map(column => (
                        <SortHeader
                            key={column.key}
                            column={column}
                            sortConfig={sortConfig}
                            onSort={onSort}
                        />
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map(row => (
                    <tr key={row.id || row.transactionId || row.bookId || row.communityId}>
                        {columns.map(column => (
                            <td key={column.key} data-label={column.label}>
                                {column.render ? column.render(row) : row[column.key]}
                            </td>
                        ))}
                    </tr>
                ))}
                {rows.length === 0 && (
                    <tr>
                        <td colSpan={columns.length}>{emptyMessage}</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

const DonutChart = ({ title, data, formatter = value => value }) => {
    const total = data.reduce((sum, item) => sum + toNumber(item.value), 0);
    let current = 0;
    const gradient = total > 0
        ? data.map((item, index) => {
            const start = current;
            const end = current + ((toNumber(item.value) / total) * 100);
            current = end;
            return `${item.color || chartColors[index % chartColors.length]} ${start}% ${end}%`;
        }).join(', ')
        : '#e5e7eb 0% 100%';

    return (
        <div className="chart-card">
            <h2>{title}</h2>
            <div className="donut-row">
                <div className="donut-chart" style={{ background: `conic-gradient(${gradient})` }}>
                    <span>{total > 0 ? formatter(total) : '-'}</span>
                </div>
                <div className="chart-legend">
                    {data.map((item, index) => (
                        <div key={item.label}>
                            <i style={{ backgroundColor: item.color || chartColors[index % chartColors.length] }} />
                            <span>{item.label}</span>
                            <strong>{formatter(item.value)}</strong>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const BarChart = ({ title, rows, labelKey, valueKey, formatter = value => value }) => {
    const maxValue = Math.max(...rows.map(row => toNumber(row[valueKey])), 0);

    return (
        <div className="chart-card">
            <h2>{title}</h2>
            <div className="bar-list">
                {rows.length === 0 && <p>No data for this period.</p>}
                {rows.map(row => {
                    const value = toNumber(row[valueKey]);
                    const width = maxValue > 0 ? `${Math.max(6, (value / maxValue) * 100)}%` : '0%';
                    return (
                        <div className="bar-row" key={row.id || row.bookId || row.communityId}>
                            <div className="bar-label">
                                <span>{row[labelKey]}</span>
                                <strong>{formatter(value)}</strong>
                            </div>
                            <div className="bar-track">
                                <span style={{ width }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const bookColumns = [
    {
        key: 'bookName',
        label: 'Book',
        type: 'text',
        sortValue: row => row.bookName,
        exportValue: row => row.bookName,
        render: row => (
            <>
                <strong>{row.bookName}</strong>
                {row.author && <span className="table-subtext">by {row.author}</span>}
            </>
        ),
    },
    { key: 'timesLent', label: 'Lent', type: 'number' },
    { key: 'lastTransactionDate', label: 'Last Date', type: 'date', render: row => formatDate(row.lastTransactionDate) },
    { key: 'billed', label: 'Billed', type: 'number', render: row => currency.format(row.billed) },
    { key: 'collected', label: 'Collected', type: 'number', render: row => currency.format(row.collected) },
    { key: 'pending', label: 'Pending', type: 'number', render: row => currency.format(row.pending) },
    { key: 'purchasePrice', label: 'Cost', type: 'number', render: row => currency.format(row.purchasePrice) },
    { key: 'roi', label: 'Profit', type: 'number', render: row => currency.format(row.roi) },
];

const communityColumns = [
    { key: 'communityName', label: 'Community', type: 'text' },
    { key: 'transactions', label: 'Txns', type: 'number' },
    { key: 'activeCustomerCount', label: 'Customers', type: 'number' },
    { key: 'lastTransactionDate', label: 'Last Date', type: 'date', render: row => formatDate(row.lastTransactionDate) },
    { key: 'billed', label: 'Billed', type: 'number', render: row => currency.format(row.billed) },
    { key: 'collected', label: 'Collected', type: 'number', render: row => currency.format(row.collected) },
    { key: 'pending', label: 'Pending', type: 'number', render: row => currency.format(row.pending) },
];

const duesColumns = [
    { key: 'customerName', label: 'Customer', type: 'text' },
    { key: 'bookName', label: 'Book', type: 'text' },
    { key: 'pickupDate', label: 'Pickup', type: 'date', render: row => formatDate(row.pickupDate) },
    { key: 'billed', label: 'Billed', type: 'number', render: row => currency.format(row.billed) },
    { key: 'paid', label: 'Paid', type: 'number', render: row => currency.format(row.paid) },
    { key: 'pending', label: 'Due', type: 'number', render: row => currency.format(row.pending) },
];

const transactionColumns = [
    { key: 'transactionDate', label: 'Date', type: 'date', render: row => formatDate(row.transactionDate) },
    { key: 'customerName', label: 'Customer', type: 'text' },
    { key: 'bookName', label: 'Book', type: 'text' },
    { key: 'communityName', label: 'Community', type: 'text' },
    { key: 'billed', label: 'Billed', type: 'number', render: row => currency.format(row.billed) },
    { key: 'paid', label: 'Paid', type: 'number', render: row => currency.format(row.paid) },
    { key: 'pending', label: 'Due', type: 'number', render: row => currency.format(row.pending) },
    { key: 'status', label: 'Status', type: 'text' },
    { key: 'offerLabel', label: 'Offer / Sub', type: 'text' },
];

const Reports = () => {
    const [periodMode, setPeriodMode] = useState('all');
    const [sortConfig, setSortConfig] = useState({
        books: { key: 'billed', direction: 'desc' },
        communities: { key: 'billed', direction: 'desc' },
        dues: { key: 'pending', direction: 'desc' },
        transactions: { key: 'transactionDate', direction: 'desc' },
    });
    const [expandedTables, setExpandedTables] = useState({
        books: false,
        communities: false,
        dues: false,
        transactions: false,
    });
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
            if (transaction.subscriptionTxnId) {
                acc.subscription += 1;
            } else if (transaction.offerId) {
                acc.offer += 1;
            } else {
                acc.normal += 1;
            }

            return acc;
        }, {
            billed: 0,
            collected: 0,
            pending: 0,
            transactions: 0,
            returned: 0,
            active: 0,
            normal: 0,
            offer: 0,
            subscription: 0,
        });

        const uniqueBookIds = [...new Set(filteredTransactions.map(transaction => transaction.bookId).filter(Boolean))];
        const transactedBookCost = uniqueBookIds.reduce((sum, bookId) => {
            const book = booksById[bookId];
            return sum + toNumber(book?.purchasePrice);
        }, 0);

        const bookMap = new Map();
        const communityMap = new Map();
        const duesRows = [];
        const transactionRows = [];

        filteredTransactions.forEach(transaction => {
            const totalAmount = toNumber(transaction.totalAmount);
            const amountPaid = toNumber(transaction.amountPaid);
            const pending = Math.max(0, totalAmount - amountPaid);
            const transactionDate = getTransactionDate(transaction);
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
                    lastTransactionDate: '',
                });
            }

            const bookRow = bookMap.get(transaction.bookId);
            bookRow.timesLent += 1;
            bookRow.billed += bookRevenueAmount;
            bookRow.collected += isSubscription ? bookRevenueAmount : amountPaid;
            bookRow.pending += isSubscription ? 0 : pending;
            if (!bookRow.lastTransactionDate || compareValues(transactionDate, bookRow.lastTransactionDate, 'date') > 0) {
                bookRow.lastTransactionDate = transactionDate;
            }

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
                    lastTransactionDate: '',
                });
            }

            const communityRow = communityMap.get(communityKey);
            communityRow.transactions += 1;
            communityRow.billed += totalAmount;
            communityRow.collected += amountPaid;
            communityRow.pending += pending;
            if (transaction.customerId) communityRow.activeCustomers.add(transaction.customerId);
            if (!communityRow.lastTransactionDate || compareValues(transactionDate, communityRow.lastTransactionDate, 'date') > 0) {
                communityRow.lastTransactionDate = transactionDate;
            }

            transactionRows.push({
                transactionId: transaction.transactionId,
                transactionDate,
                customerName: transaction.customerName || customer?.customerName || transaction.customerId || '-',
                bookName: transaction.bookName || book?.bookName || transaction.bookId || '-',
                communityName: community?.communityName || 'Unknown Community',
                billed: totalAmount,
                paid: amountPaid,
                pending,
                status: transaction.returnDate ? 'Returned' : 'Active',
                offerLabel: getOfferLabel(transaction),
            });

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
            transactionRows,
        };
    }, [booksById, communities, customers, periodMode, selectedRange, transactions]);

    const sortedBookPerformance = useMemo(
        () => sortRows(report.bookPerformance, bookColumns, sortConfig.books),
        [report.bookPerformance, sortConfig.books],
    );
    const sortedCommunityPerformance = useMemo(
        () => sortRows(report.communityPerformance, communityColumns, sortConfig.communities),
        [report.communityPerformance, sortConfig.communities],
    );
    const sortedDuesRows = useMemo(
        () => sortRows(report.duesRows, duesColumns, sortConfig.dues),
        [report.duesRows, sortConfig.dues],
    );
    const sortedTransactionRows = useMemo(
        () => sortRows(report.transactionRows, transactionColumns, sortConfig.transactions),
        [report.transactionRows, sortConfig.transactions],
    );

    const handleSort = (tableName, key) => {
        setSortConfig(prev => ({
            ...prev,
            [tableName]: nextSortConfig(prev[tableName], key),
        }));
    };

    const fileSuffix = periodMode === 'all'
        ? 'all-time'
        : `${selectedRange.from || 'start'}-to-${selectedRange.to || 'today'}`;

    const exportTable = (name, columns, rows) => {
        downloadCsv(`${name}-${fileSuffix}.csv`, columns, rows);
    };

    const getVisibleRows = (tableName, rows) => (
        expandedTables[tableName] ? rows : rows.slice(0, REPORT_PREVIEW_LIMIT)
    );

    const toggleExpanded = (tableName) => {
        setExpandedTables(prev => ({
            ...prev,
            [tableName]: !prev[tableName],
        }));
    };

    const renderTableActions = (tableName, totalRows, onExport) => (
        <div className="panel-actions">
            {totalRows > REPORT_PREVIEW_LIMIT && (
                <button
                    type="button"
                    className="view-toggle-button"
                    onClick={() => toggleExpanded(tableName)}
                >
                    {expandedTables[tableName] ? 'Show 10' : `View All (${totalRows})`}
                </button>
            )}
            <button type="button" className="export-button" onClick={onExport}>
                Export
            </button>
        </div>
    );

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
                <div className="report-actions">
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
                    <button
                        type="button"
                        className="export-button"
                        onClick={() => exportTable('transactions', transactionColumns, sortedTransactionRows)}
                    >
                        Export Transactions
                    </button>
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
                    <span>Total Invested</span>
                    <strong>{currency.format(report.totals.transactedBookCost)}</strong>
                </div>
                <div className="metric-card">
                    <span>Estimated Net</span>
                    <strong>{currency.format(report.totals.netAfterBookCost)}</strong>
                </div>
            </section>

            <section className="chart-grid">
                <DonutChart
                    title="Collections"
                    data={[
                        { label: 'Collected', value: report.totals.collected, color: '#16a34a' },
                        { label: 'Pending', value: report.totals.pending, color: '#f59e0b' },
                    ]}
                    formatter={value => currency.format(value)}
                />
                <DonutChart
                    title="Loan Status"
                    data={[
                        { label: 'Active', value: report.totals.active, color: '#2563eb' },
                        { label: 'Returned', value: report.totals.returned, color: '#14b8a6' },
                    ]}
                />
                <DonutChart
                    title="Lending Type"
                    data={[
                        { label: 'Normal', value: report.totals.normal, color: '#64748b' },
                        { label: 'Offer', value: report.totals.offer, color: '#db2777' },
                        { label: 'Subscription', value: report.totals.subscription, color: '#f59e0b' },
                    ]}
                />
                <BarChart
                    title="Top Books by Revenue"
                    rows={sortByAmount(report.bookPerformance, 'billed').slice(0, 5)}
                    labelKey="bookName"
                    valueKey="billed"
                    formatter={value => currency.format(value)}
                />
            </section>

            <section className="report-panel">
                <div className="panel-heading">
                    <h2>Book Performance</h2>
                    {renderTableActions(
                        'books',
                        sortedBookPerformance.length,
                        () => exportTable('book-performance', bookColumns, sortedBookPerformance),
                    )}
                </div>
                <ReportTable
                    columns={bookColumns}
                    rows={getVisibleRows('books', sortedBookPerformance)}
                    sortConfig={sortConfig.books}
                    onSort={(key) => handleSort('books', key)}
                    emptyMessage="No book performance data for this period."
                />
            </section>

            <section className="report-panel">
                <div className="panel-heading">
                    <h2>Community Performance</h2>
                    {renderTableActions(
                        'communities',
                        sortedCommunityPerformance.length,
                        () => exportTable('community-performance', communityColumns, sortedCommunityPerformance),
                    )}
                </div>
                <ReportTable
                    columns={communityColumns}
                    rows={getVisibleRows('communities', sortedCommunityPerformance)}
                    sortConfig={sortConfig.communities}
                    onSort={(key) => handleSort('communities', key)}
                    emptyMessage="No community performance data for this period."
                />
            </section>

            <section className="report-panel">
                <div className="panel-heading">
                    <h2>Pending Dues</h2>
                    {renderTableActions(
                        'dues',
                        sortedDuesRows.length,
                        () => exportTable('pending-dues', duesColumns, sortedDuesRows),
                    )}
                </div>
                <ReportTable
                    columns={duesColumns}
                    rows={getVisibleRows('dues', sortedDuesRows)}
                    sortConfig={sortConfig.dues}
                    onSort={(key) => handleSort('dues', key)}
                    emptyMessage="No pending dues for this period."
                />
            </section>

            <section className="report-panel">
                <div className="panel-heading">
                    <h2>Transaction Details</h2>
                    {renderTableActions(
                        'transactions',
                        sortedTransactionRows.length,
                        () => exportTable('transaction-details', transactionColumns, sortedTransactionRows),
                    )}
                </div>
                <ReportTable
                    columns={transactionColumns}
                    rows={getVisibleRows('transactions', sortedTransactionRows)}
                    sortConfig={sortConfig.transactions}
                    onSort={(key) => handleSort('transactions', key)}
                    emptyMessage="No transactions for this period."
                />
            </section>
        </div>
    );
};

export default Reports;
