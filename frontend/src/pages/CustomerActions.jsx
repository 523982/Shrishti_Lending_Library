import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { CustomerSummaryView } from '../components/SummaryViews';
import ManagementActionMenu from '../components/ManagementActionMenu';
import './AdminForms.css';
import './BookActions.css';

const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const customerActionItems = [
    { key: 'add', label: 'Add Customer' },
    { key: 'modify', label: 'Modify Customer' },
    { key: 'delete', label: 'Delete Customer' },
    { key: 'payment', label: 'Collect Payment' },
    { key: 'view', label: 'View Customer' },
];

const emptyCustomer = {
    customerName: '',
    blockNumber: '',
    unitNumber: '',
    mobileNumber: '',
    communityId: '',
};

const getEmptyCustomer = () => ({ ...emptyCustomer });

const getCustomerCommunityId = (customer) => (
    customer?.community?.communityId ||
    customer?.communityId ||
    ''
);

const toNumber = (value) => Number(value) || 0;

const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const isActivePaymentRow = (transaction) => Boolean(transaction?.active || !transaction?.returnDate);

const getPendingAmount = (transaction) => Math.max(
    0,
    toNumber(transaction?.pendingAmount ?? (toNumber(transaction?.totalAmount) - toNumber(transaction?.amountPaid))),
);

const toCustomerFormData = (customer) => ({
    customerName: customer?.customerName || '',
    blockNumber: customer?.blockNumber || '',
    unitNumber: customer?.unitNumber || '',
    mobileNumber: customer?.mobileNumber || '',
    communityId: getCustomerCommunityId(customer),
});

const getApiErrorMessage = (err, fallback) => {
    const data = err.response?.data;
    if (typeof data === 'string' && data.trim()) {
        return data;
    }
    return data?.message || data?.error || fallback;
};

const CustomerActionsPage = () => {
    const [currentAction, setCurrentAction] = useState('add');
    const [customerData, setCustomerData] = useState(getEmptyCustomer());
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [communities, setCommunities] = useState([]);
    const [loadingCommunities, setLoadingCommunities] = useState(true);
    const [customerSummary, setCustomerSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const [isUpdatingCustomer, setIsUpdatingCustomer] = useState(false);
    const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
    const [paymentAmounts, setPaymentAmounts] = useState({});
    const [collectingTransactionId, setCollectingTransactionId] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const addCustomerRequestInFlight = useRef(false);
    const updateCustomerRequestInFlight = useRef(false);
    const deleteCustomerRequestInFlight = useRef(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleViewBack = () => {
        const returnTo = location.state?.returnTo;
        if (returnTo?.pathname) {
            navigate(returnTo.pathname, { state: returnTo.state || {} });
            return;
        }

        if (window.history.length > 1 && location.key !== 'default') {
            navigate(-1);
            return;
        }

        navigate('/admin/customers');
    };

    const loadCustomerSummary = async (customerId) => {
        if (!customerId) return;
        try {
            setLoadingSummary(true);
            setError(null);
            const response = await apiClient.get(`/customers/${customerId}/summary`);
            setCustomerSummary(response.data);
            setSelectedCustomerId(response.data.customerId);
            setSelectedCustomer(response.data);
            setSearchQuery(response.data.customerName || '');
        } catch (err) {
            console.error('Error loading customer summary:', err);
            setCustomerSummary(null);
            setError(getApiErrorMessage(err, 'Failed to load customer summary.'));
        } finally {
            setLoadingSummary(false);
        }
    };

    useEffect(() => {
        if (['view', 'payment'].includes(location.state?.customerAction) && location.state?.customerId) {
            setCurrentAction(location.state.customerAction);
            loadCustomerSummary(location.state.customerId);
            return;
        }
        if (location.state?.customerData) {
            setCustomerData(location.state.customerData);
            setCurrentAction('add');
        }
        if (location.state?.newCommunityId) {
            setCustomerData(prev => ({ ...prev, communityId: location.state.newCommunityId }));
            setCurrentAction('add');
        }
    }, [location.state]);

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                setLoadingCommunities(true);
                const response = await apiClient.get('/communities');
                setCommunities(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error('Error fetching communities:', err);
                setError('Failed to load communities.');
            } finally {
                setLoadingCommunities(false);
            }
        };

        fetchCommunities();
    }, []);

    useEffect(() => {
        if (!['modify', 'delete', 'view', 'payment'].includes(currentAction) || searchQuery.trim() === '') {
            setSearchResults([]);
            return;
        }

        if (selectedCustomer && searchQuery === selectedCustomer.customerName) {
            setSearchResults([]);
            return;
        }

        setLoadingSearch(true);
        const debounceTimer = setTimeout(async () => {
            try {
                const response = await apiClient.get(`/customers/search?q=${encodeURIComponent(searchQuery)}`);
                setSearchResults(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error('Error searching customers:', err);
                setError('Failed to search customers.');
                setSearchResults([]);
            } finally {
                setLoadingSearch(false);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [currentAction, searchQuery, selectedCustomer]);

    const clearMessages = () => {
        setError(null);
        setSuccess(null);
    };

    const handleActionChange = (action) => {
        setCurrentAction(action);
        setSelectedCustomer(null);
        setSelectedCustomerId(null);
        setSearchQuery('');
        setSearchResults([]);
        setCustomerSummary(null);
        setPaymentAmounts({});
        setCollectingTransactionId(null);
        clearMessages();
        if (action === 'add') {
            setCustomerData(getEmptyCustomer());
        }
    };

    const handleCustomerChange = (e) => {
        const { name, value } = e.target;
        setCustomerData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectCustomer = (customer) => {
        setSelectedCustomerId(customer.customerId);
        setSelectedCustomer(customer);
        setCustomerData(toCustomerFormData(customer));
        setSearchQuery(customer.customerName);
        setSearchResults([]);
        clearMessages();
        if (['view', 'payment'].includes(currentAction)) {
            loadCustomerSummary(customer.customerId);
        }
    };

    const buildPayload = () => {
        const communityId = Number(customerData.communityId);

        return {
            ...customerData,
            communityId,
            community: { communityId },
        };
    };

    const validateCustomer = () => {
        if (!customerData.customerName.trim()) {
            setError('Customer Name cannot be empty.');
            return false;
        }
        if (!customerData.communityId) {
            setError('Please select a community.');
            return false;
        }
        return true;
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (addCustomerRequestInFlight.current) {
            return;
        }

        clearMessages();
        if (!validateCustomer()) return;

        addCustomerRequestInFlight.current = true;
        setIsAddingCustomer(true);

        try {
            await apiClient.post('/customers', buildPayload());
            setSuccess('Customer added successfully.');
            setCustomerData(getEmptyCustomer());
        } catch (err) {
            console.error('Error adding customer:', err);
            setError(getApiErrorMessage(err, 'Failed to add customer.'));
        } finally {
            addCustomerRequestInFlight.current = false;
            setIsAddingCustomer(false);
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        if (updateCustomerRequestInFlight.current) {
            return;
        }

        clearMessages();
        if (!selectedCustomerId) {
            setError('Please select a customer to modify.');
            return;
        }
        if (!validateCustomer()) return;

        updateCustomerRequestInFlight.current = true;
        setIsUpdatingCustomer(true);

        try {
            await apiClient.put(`/customers/${selectedCustomerId}`, buildPayload());
            setSuccess('Customer updated successfully.');
            setSelectedCustomer(null);
            setSelectedCustomerId(null);
            setCustomerData(getEmptyCustomer());
            setSearchQuery('');
            setSearchResults([]);
        } catch (err) {
            console.error('Error updating customer:', err);
            setError(getApiErrorMessage(err, 'Failed to update customer.'));
        } finally {
            updateCustomerRequestInFlight.current = false;
            setIsUpdatingCustomer(false);
        }
    };

    const handleDelete = async () => {
        if (deleteCustomerRequestInFlight.current) {
            return;
        }

        clearMessages();
        if (!selectedCustomerId || !selectedCustomer) {
            setError('Please select a customer to delete.');
            return;
        }
        if (!window.confirm(`Are you sure you want to delete "${selectedCustomer.customerName}"?`)) {
            return;
        }

        deleteCustomerRequestInFlight.current = true;
        setIsDeletingCustomer(true);

        try {
            await apiClient.delete(`/customers/delete/${selectedCustomerId}`);
            setSuccess('Customer deleted successfully.');
            setSelectedCustomer(null);
            setSelectedCustomerId(null);
            setCustomerData(getEmptyCustomer());
            setSearchQuery('');
        } catch (err) {
            console.error('Error deleting customer:', err);
            setError(getApiErrorMessage(err, 'Failed to delete customer.'));
        } finally {
            deleteCustomerRequestInFlight.current = false;
            setIsDeletingCustomer(false);
        }
    };

    const pendingPaymentRows = (() => {
        const activeRows = (customerSummary?.activeBooks || [])
            .filter(row => !row.subscriptionTxnId);
        const returnedPendingRows = (customerSummary?.history || [])
            .filter(row => !isActivePaymentRow(row) && !row.subscriptionTxnId && getPendingAmount(row) > 0);
        const rowsByTransactionId = new Map();

        [...activeRows, ...returnedPendingRows].forEach(row => {
            rowsByTransactionId.set(row.transactionId, row);
        });

        return [...rowsByTransactionId.values()];
    })();

    const handlePaymentAmountChange = (transactionId, value) => {
        setPaymentAmounts(prev => ({
            ...prev,
            [transactionId]: value,
        }));
    };

    const handleCollectPayment = async (transaction) => {
        clearMessages();
        const paymentValue = Number(paymentAmounts[transaction.transactionId]);
        const pendingAmount = getPendingAmount(transaction);
        const isActiveTransaction = isActivePaymentRow(transaction);

        if (!paymentValue || paymentValue <= 0) {
            setError('Please enter a payment amount greater than zero.');
            return;
        }

        if (!isActiveTransaction && paymentValue > pendingAmount) {
            setError('Payment amount cannot be more than the pending balance.');
            return;
        }

        setCollectingTransactionId(transaction.transactionId);
        try {
            await apiClient.put(`/transactions/${transaction.transactionId}/payment`, {
                amountPaid: paymentValue,
            });
            setSuccess('Payment collected successfully.');
            setPaymentAmounts(prev => {
                const next = { ...prev };
                delete next[transaction.transactionId];
                return next;
            });
            await loadCustomerSummary(selectedCustomerId);
        } catch (err) {
            console.error('Error collecting payment:', err);
            setError(getApiErrorMessage(err, 'Failed to collect payment.'));
        } finally {
            setCollectingTransactionId(null);
        }
    };

    const renderCustomerForm = (onSubmit, buttonText, isSubmitting = false, submittingText = buttonText) => (
        <form onSubmit={onSubmit} className="admin-form">
            <div className="form-group">
                <label htmlFor="customerName">Customer Name</label>
                <input type="text" id="customerName" name="customerName" value={customerData.customerName} onChange={handleCustomerChange} required />
            </div>
            <div className="form-group">
                <label htmlFor="blockNumber">Block Number</label>
                <input type="text" id="blockNumber" name="blockNumber" value={customerData.blockNumber} onChange={handleCustomerChange} />
            </div>
            <div className="form-group">
                <label htmlFor="unitNumber">Unit Number</label>
                <input type="text" id="unitNumber" name="unitNumber" value={customerData.unitNumber} onChange={handleCustomerChange} />
            </div>
            <div className="form-group">
                <label htmlFor="mobileNumber">Mobile Number</label>
                <input type="tel" id="mobileNumber" name="mobileNumber" value={customerData.mobileNumber} onChange={handleCustomerChange} />
            </div>
            <div className="form-group">
                <label htmlFor="communityId">Community</label>
                <div className="community-input-group">
                    <select id="communityId" name="communityId" value={customerData.communityId} onChange={handleCustomerChange} required disabled={loadingCommunities}>
                        <option value="">{loadingCommunities ? 'Loading...' : 'Select a community'}</option>
                        {communities.map(community => (
                            <option key={community.communityId} value={community.communityId}>
                                {community.communityName}
                            </option>
                        ))}
                    </select>
                    <Link
                        to="/admin/add-community"
                        state={{ from: location.pathname, customerData }}
                        className="add-new-link"
                    >
                        Add New
                    </Link>
                </div>
            </div>
            <button type="submit" className="submit-button" disabled={loadingCommunities || isSubmitting}>
                {isSubmitting ? submittingText : buttonText}
            </button>
        </form>
    );

    const renderCustomerSearch = (label) => (
        <div className="search-container">
            <label htmlFor="customerSearch">{label}</label>
            <input
                type="text"
                id="customerSearch"
                name="customerSearch"
                placeholder="Start typing a customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
            />
            {selectedCustomer && <button type="button" className="clear-selection-btn" onClick={() => handleActionChange(currentAction)}>&times;</button>}
            {loadingSearch && <div className="loader"></div>}
            {!loadingSearch && searchResults.length > 0 && (
                <ul className="search-results">
                    {searchResults.map(customer => (
                        <li key={customer.customerId} onClick={() => handleSelectCustomer(customer)}>
                            {customer.customerName}
                        </li>
                    ))}
                </ul>
            )}
            {!loadingSearch && searchResults.length === 0 && searchQuery.trim() !== '' && !selectedCustomer && (
                <ul className="search-results">
                    <li className="no-results">No customers found</li>
                </ul>
            )}
        </div>
    );

    return (
        <div className={`admin-form-container ${['view', 'payment'].includes(currentAction) ? 'summary-container' : ''}`}>
            <ManagementActionMenu
                title="Customer Management"
                actions={customerActionItems}
                currentAction={currentAction}
                onActionChange={handleActionChange}
            />
            <Link to="/" className="back-link">&larr; Back to Dashboard</Link>

            {currentAction === 'add' && (
                <>
                    <h1>Add a New Customer</h1>
                    {renderCustomerForm(handleAddSubmit, 'Add Customer', isAddingCustomer, 'Adding Customer...')}
                </>
            )}

            {currentAction === 'modify' && (
                <>
                    <h1>Modify Customer Details</h1>
                    {renderCustomerSearch('Search for a Customer to Modify')}
                    {selectedCustomer && renderCustomerForm(handleUpdateSubmit, 'Update Customer', isUpdatingCustomer, 'Updating Customer...')}
                </>
            )}

            {currentAction === 'delete' && (
                <>
                    <h1>Delete a Customer</h1>
                    {renderCustomerSearch('Search for a Customer to Delete')}
                    {selectedCustomer && (
                        <div className="book-details-display">
                            <h3>{selectedCustomer.customerName}</h3>
                            <p><strong>Block:</strong> {selectedCustomer.blockNumber || 'N/A'}</p>
                            <p><strong>Unit:</strong> {selectedCustomer.unitNumber || 'N/A'}</p>
                            <p><strong>Mobile:</strong> {selectedCustomer.mobileNumber || 'N/A'}</p>
                            <p><strong>Community:</strong> {selectedCustomer.community?.communityName || selectedCustomer.communityId || 'N/A'}</p>
                            <button type="button" onClick={handleDelete} className="submit-button delete-button" disabled={isDeletingCustomer}>
                                {isDeletingCustomer ? 'Deleting Customer...' : 'Delete This Customer'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {currentAction === 'view' && (
                <>
                    <h1>View Customer</h1>
                    <button type="button" className="history-back-button" onClick={handleViewBack}>Back</button>
                    {renderCustomerSearch('Search for a Customer to View')}
                    {loadingSummary && <p>Loading customer summary...</p>}
                    {!loadingSummary && customerSummary && <CustomerSummaryView summary={customerSummary} />}
                </>
            )}

            {currentAction === 'payment' && (
                <>
                    <h1>Collect Pending Payment</h1>
                    {renderCustomerSearch('Search for a Customer to Collect Payment')}
                    {loadingSummary && <p>Loading pending payments...</p>}
                    {!loadingSummary && selectedCustomer && customerSummary && (
                        <div className="payment-collection-panel">
                            <h2>{customerSummary.customerName}</h2>
                            {pendingPaymentRows.length === 0 ? (
                                <p>No pending payment or active normal loan for this customer.</p>
                            ) : (
                                <div className="payment-table-wrap">
                                    <table className="payment-table">
                                        <thead>
                                            <tr>
                                                <th>Book</th>
                                                <th>Pickup</th>
                                                <th>Return</th>
                                                <th>Billed</th>
                                                <th>Paid</th>
                                                <th>Pending</th>
                                                <th>Collect</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingPaymentRows.map(transaction => {
                                                const pendingAmount = getPendingAmount(transaction);
                                                const isActiveTransaction = isActivePaymentRow(transaction);
                                                const isCollecting = collectingTransactionId === transaction.transactionId;

                                                return (
                                                    <tr key={transaction.transactionId}>
                                                        <td data-label="Book">{transaction.bookName || '-'}</td>
                                                        <td data-label="Pickup">{formatDate(transaction.pickupDate)}</td>
                                                        <td data-label="Return">{formatDate(transaction.returnDate)}</td>
                                                        <td data-label="Billed">{currency.format(transaction.totalAmount)}</td>
                                                        <td data-label="Paid">{currency.format(transaction.amountPaid)}</td>
                                                        <td data-label="Pending">
                                                            <strong>{isActiveTransaction ? 'Active loan' : currency.format(pendingAmount)}</strong>
                                                            {isActiveTransaction && (
                                                                <span className="table-subtext">
                                                                    Paid till now {currency.format(transaction.amountPaid)}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td data-label="Collect">
                                                            <div className="payment-entry">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={isActiveTransaction ? undefined : pendingAmount}
                                                                    step="0.01"
                                                                    placeholder={isActiveTransaction ? 'Advance amount' : String(pendingAmount)}
                                                                    value={paymentAmounts[transaction.transactionId] || ''}
                                                                    onChange={(event) => handlePaymentAmountChange(transaction.transactionId, event.target.value)}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="submit-button payment-submit-button"
                                                                    disabled={isCollecting}
                                                                    onClick={() => handleCollectPayment(transaction)}
                                                                >
                                                                    {isCollecting ? 'Saving...' : isActiveTransaction ? 'Add' : 'Save'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {success && <p className="success-message">{success}</p>}
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default CustomerActionsPage;
