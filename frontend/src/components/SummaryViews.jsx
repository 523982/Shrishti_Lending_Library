import React from 'react';
import { Link } from 'react-router-dom';
import './SummaryViews.css';

const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const formatCurrency = (value) => currency.format(Number(value) || 0);

const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const describeOffer = (offer) => {
    if (!offer) return 'No active offer';
    if (offer.offerType === 'BUNDLE') {
        return `${offer.bundleBookCount || 0} books for ${formatCurrency(offer.bundlePrice)} in ${offer.bundleDurationDays || 0} days`;
    }
    return `${Number(offer.discountPercent) || 0}% off`;
};

const getOfferLabel = (row) => {
    if (row.subscriptionTxnId) {
        return `Subscription ${row.bundleBookNo || '-'} / ${row.bundleBookLimit || '-'}`;
    }
    if (row.offerName) {
        return row.offerName;
    }
    return 'Normal';
};

const MetricCard = ({ label, value }) => (
    <div className="summary-metric">
        <span>{label}</span>
        <strong>{value}</strong>
    </div>
);

const SummaryMetrics = ({ items }) => (
    <div className="summary-metrics">
        {items.map(item => (
            <MetricCard key={item.label} label={item.label} value={item.value} />
        ))}
    </div>
);

const TransactionTable = ({ rows = [], context, emptyMessage = 'No transactions found.' }) => (
    <div className="summary-table-wrap">
        <table className="summary-table">
            <thead>
                <tr>
                    <th>Book</th>
                    {context !== 'customer' && <th>Customer</th>}
                    <th>Pickup</th>
                    <th>Return</th>
                    <th>Amount</th>
                    <th>Offer / Sub</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {rows.map(row => (
                    <tr key={row.transactionId}>
                        <td data-label="Book">
                            {row.bookId ? (
                                <Link to="/admin/books" state={{ adminBookAction: 'view', bookId: row.bookId }}>
                                    {row.bookName || row.bookId}
                                </Link>
                            ) : row.bookName || '-'}
                            {row.author && <span className="summary-subtext">by {row.author}</span>}
                        </td>
                        {context !== 'customer' && (
                            <td data-label="Customer">
                                {row.customerId ? (
                                    <Link to="/admin/customers" state={{ customerAction: 'view', customerId: row.customerId }}>
                                        {row.customerName || row.customerId}
                                    </Link>
                                ) : row.customerName || '-'}
                                {row.mobileNumber && <span className="summary-subtext">{row.mobileNumber}</span>}
                            </td>
                        )}
                        <td data-label="Pickup">{formatDate(row.pickupDate)}</td>
                        <td data-label="Return">{formatDate(row.returnDate)}</td>
                        <td data-label="Amount">
                            <strong>{formatCurrency(row.totalAmount)}</strong>
                            <span className="summary-subtext">Paid {formatCurrency(row.amountPaid)}</span>
                        </td>
                        <td data-label="Offer / Sub">{getOfferLabel(row)}</td>
                        <td data-label="Status">{row.active ? 'Active' : 'Returned'}</td>
                    </tr>
                ))}
                {rows.length === 0 && (
                    <tr>
                        <td colSpan={context === 'customer' ? 6 : 7}>{emptyMessage}</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

export const CustomerSummaryView = ({ summary }) => {
    if (!summary) return null;
    const subscription = summary.activeSubscription;

    return (
        <div className="summary-view">
            <div className="summary-heading">
                <div>
                    <h2>{summary.customerName}</h2>
                    <p>
                        {summary.blockNumber || '-'} / {summary.unitNumber || '-'}
                        {summary.mobileNumber ? ` | ${summary.mobileNumber}` : ''}
                    </p>
                </div>
                {summary.communityId && (
                    <Link to="/admin/add-community" state={{ communityAction: 'view', communityId: summary.communityId }}>
                        {summary.communityName || 'View Community'}
                    </Link>
                )}
            </div>

            <SummaryMetrics items={[
                { label: 'Active Books', value: summary.activeBookCount || 0 },
                { label: 'Billed', value: formatCurrency(summary.totalBilled) },
                { label: 'Collected', value: formatCurrency(summary.totalCollected) },
                { label: 'Pending', value: formatCurrency(summary.totalPending) },
            ]} />

            {subscription?.hasActiveSubscription && (
                <section className="summary-panel">
                    <h3>Active Subscription</h3>
                    <p>{subscription.offerName || subscription.subscriptionTxnId}</p>
                    <div className="summary-inline">
                        <span>Books {subscription.booksUsed || 0} / {subscription.bundleBookLimit || 0}</span>
                        <span>Open {subscription.openBooks || 0}</span>
                        <span>Paid {formatCurrency(subscription.amountPaid)}</span>
                        <span>Valid till {formatDate(subscription.subscriptionEndDate)}</span>
                    </div>
                </section>
            )}

            <section className="summary-panel">
                <h3>Books With Customer</h3>
                <TransactionTable rows={summary.activeBooks} context="customer" emptyMessage="No active books with this customer." />
            </section>

            <section className="summary-panel">
                <h3>Customer History</h3>
                <TransactionTable rows={summary.history} context="customer" />
            </section>
        </div>
    );
};

export const BookSummaryView = ({ summary }) => {
    if (!summary) return null;
    const fallbackInitial = String(summary.bookName || 'B').trim().charAt(0).toUpperCase() || 'B';

    return (
        <div className="summary-view">
            <div className="summary-heading book-summary-heading">
                <div className="summary-book-title">
                    {summary.imageUrl ? (
                        <img src={summary.imageUrl} alt={`${summary.bookName} cover`} />
                    ) : (
                        <span className="summary-book-placeholder" aria-hidden="true">{fallbackInitial}</span>
                    )}
                    <div>
                        <h2>{summary.bookName}</h2>
                        <p>{summary.author ? `by ${summary.author}` : 'Unknown author'}{summary.genre ? ` | ${summary.genre}` : ''}</p>
                    </div>
                </div>
                <span className={`summary-status ${String(summary.statusDesc).toLowerCase() === 'available' ? 'available' : 'unavailable'}`}>
                    {summary.statusDesc || 'Unknown'}
                </span>
            </div>

            <SummaryMetrics items={[
                { label: 'Times Lent', value: summary.timesLent || 0 },
                { label: 'Book Revenue', value: formatCurrency(summary.totalBookRevenue) },
                { label: 'Collected', value: formatCurrency(summary.totalCollected) },
                { label: 'Estimated Profit', value: formatCurrency(summary.estimatedProfit) },
            ]} />

            {summary.activeTransaction && (
                <section className="summary-panel">
                    <h3>Currently Lent To</h3>
                    <p>
                        <Link to="/admin/customers" state={{ customerAction: 'view', customerId: summary.activeTransaction.customerId }}>
                            {summary.activeTransaction.customerName}
                        </Link>
                    </p>
                    <div className="summary-inline">
                        <span>Pickup {formatDate(summary.activeTransaction.pickupDate)}</span>
                        <span>{getOfferLabel(summary.activeTransaction)}</span>
                    </div>
                </section>
            )}

            <section className="summary-panel">
                <h3>Book Lending History</h3>
                <TransactionTable rows={summary.history} context="book" />
            </section>
        </div>
    );
};

export const CommunitySummaryView = ({ summary }) => {
    if (!summary) return null;

    return (
        <div className="summary-view">
            <div className="summary-heading">
                <div>
                    <h2>{summary.communityName}</h2>
                    <p>{summary.customerCount || 0} customers</p>
                </div>
                <Link to="/admin/offers">Manage Offers</Link>
            </div>

            <section className="summary-panel">
                <h3>Current Offer</h3>
                <p>{summary.activeOffer?.offerName || 'No active offer'}</p>
                <div className="summary-inline">
                    <span>{describeOffer(summary.activeOffer)}</span>
                    {summary.activeOffer && <span>{formatDate(summary.activeOffer.startDate)} to {formatDate(summary.activeOffer.endDate)}</span>}
                </div>
            </section>

            <SummaryMetrics items={[
                { label: 'Active Lends', value: summary.activeLendingCount || 0 },
                { label: 'Billed', value: formatCurrency(summary.totalBilled) },
                { label: 'Collected', value: formatCurrency(summary.totalCollected) },
                { label: 'Pending', value: formatCurrency(summary.totalPending) },
            ]} />

            <section className="summary-panel">
                <h3>Currently Lent In Community</h3>
                <TransactionTable rows={summary.activeBooks} context="community" emptyMessage="No active books in this community." />
            </section>

            <section className="summary-panel">
                <h3>Community History</h3>
                <TransactionTable rows={summary.history} context="community" />
            </section>
        </div>
    );
};
