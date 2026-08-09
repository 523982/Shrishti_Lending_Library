import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import apiClient from '../services/api';
import { BookSummaryView } from '../components/SummaryViews';
import './AdminForms.css';
import './BookActions.css'; // We'll create this for new styles


const calculateReturnSummary = (transaction, returnDetails) => {
    if (!transaction) {
        return {
            billedWeeks: 1,
            totalCost: 0,
            amountPaid: 0,
            balanceDue: 0,
            isSubscription: false,
        };
    }

    if (transaction.subscriptionTxnId) {
        return {
            billedWeeks: 0,
            totalCost: Number(transaction.totalAmount) || 0,
            amountPaid: Number(transaction.amountPaid) || 0,
            balanceDue: 0,
            isSubscription: true,
        };
    }

    const pickupDate = new Date(transaction.pickupDate);
    const returnDate = new Date(returnDetails.returnDate);
    const dayMs = 1000 * 60 * 60 * 24;
    const days = Math.ceil((returnDate - pickupDate) / dayMs);
    const billedWeeks = Math.max(1, Math.ceil(days / 7));
    const weeklyRate = Number(transaction.lendingCost) || 0;
    const normalCost = (returnDetails.isSwap ? weeklyRate / 2 : weeklyRate) * billedWeeks;
    const discountRate = Number(transaction.normalAmount) > 0
        ? (Number(transaction.discountAmount) || 0) / Number(transaction.normalAmount)
        : 0;
    const totalCost = Math.max(0, normalCost - (normalCost * discountRate));
    const amountPaid = Number(transaction.amountPaid) || 0;
    const balanceDue = Math.max(0, totalCost - amountPaid);

    return {
        billedWeeks,
        totalCost,
        amountPaid,
        balanceDue,
        isSubscription: false,
    };
};

const getTodayInputValue = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getInitialLendDetails = () => ({
    pickupDate: getTodayInputValue(),
    isSwap: false,
    isPartiallyPaid: false,
    amountPaid: 0,
    offerMode: 'NORMAL',
});

const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const getCustomerCommunityId = (customer) => (
    customer?.community?.communityId ||
    customer?.communityId ||
    ''
);

const describeOffer = (offer) => {
    if (!offer) return '';
    if (offer.offerType === 'BUNDLE') {
        return `${offer.bundleBookCount || 0} books for ${currency.format(Number(offer.bundlePrice) || 0)} in ${offer.bundleDurationDays || 0} days`;
    }
    return `${Number(offer.discountPercent) || 0}% off during the offer period`;
};

const getOfferPreview = (selectedBook, lendDetails, activeOffer, activeSubscription) => {
    const lendingCost = Number(selectedBook?.lendingCost) || 0;

    if (lendDetails.offerMode === 'START_SUBSCRIPTION' && activeOffer?.offerType === 'BUNDLE') {
        const perBookRevenue = (Number(activeOffer.bundlePrice) || 0) / Math.max(1, Number(activeOffer.bundleBookCount) || 1);
        return {
            label: 'Subscription upfront payment',
            totalAmount: Number(activeOffer.bundlePrice) || 0,
            amountPaid: Number(activeOffer.bundlePrice) || 0,
            bookRevenueAmount: perBookRevenue,
        };
    }

    if (lendDetails.offerMode === 'USE_SUBSCRIPTION' && activeSubscription?.canUseSubscription) {
        return {
            label: 'Covered by active subscription',
            totalAmount: 0,
            amountPaid: 0,
            bookRevenueAmount: Number(activeSubscription.bookRevenueAmount) || 0,
        };
    }

    if (activeSubscription && !activeSubscription.canUseSubscription) {
        return {
            label: 'Subscription cannot take another book',
            totalAmount: 0,
            amountPaid: 0,
            bookRevenueAmount: Number(activeSubscription.bookRevenueAmount) || 0,
        };
    }

    if (lendDetails.offerMode === 'PERCENT' && activeOffer?.offerType === 'PERCENT') {
        const discount = lendingCost * ((Number(activeOffer.discountPercent) || 0) / 100);
        const finalAmount = Math.max(0, lendingCost - discount);
        return {
            label: 'Discounted first-week amount',
            totalAmount: finalAmount,
            amountPaid: lendDetails.isPartiallyPaid ? Number(lendDetails.amountPaid) || 0 : finalAmount,
            bookRevenueAmount: finalAmount,
        };
    }

    return {
        label: 'Normal first-week amount',
        totalAmount: lendingCost,
        amountPaid: lendDetails.isPartiallyPaid ? Number(lendDetails.amountPaid) || 0 : lendingCost,
        bookRevenueAmount: lendingCost,
    };
};


//Adding, Modifying, Deleting & Lending Books
const BookActionsPage = () => {
    // State for the "Add Book" form
    const [bookData, setBookData] = useState({
        bookName: '',
        author: '',
        genre: '',
        purchasePrice: '',
        purchaseDate: getTodayInputValue(),
        lendingCost: '',
        coverImageUrl: '',
    });

        // State for the "Modify Book" functionality
        const [currentAction, setCurrentAction] = useState('add');
        const [searchQuery, setSearchQuery] = useState('');
        const [searchResults, setSearchResults] = useState([]);
        const [selectedBook, setSelectedBook] = useState(null);
        const [bookSummary, setBookSummary] = useState(null);
        const [loadingBookSummary, setLoadingBookSummary] = useState(false);
        const [loadingSearch, setLoadingSearch] = useState(false);
        const [searchError, setSearchError] = useState(null);
        const [returnToLendAfterAdd, setReturnToLendAfterAdd] = useState(false);

    
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const location = useLocation();

    // State for the "Lend Book" functionality
    const [communities, setCommunities] = useState([]);
    const [lendCommunityFilter, setLendCommunityFilter] = useState('');
    const [lendCustomerQuery, setLendCustomerQuery] = useState('');
    const [lendCustomerResults, setLendCustomerResults] = useState([]);
    const [selectedLendCustomer, setSelectedLendCustomer] = useState(null);
    const [loadingLendData, setLoadingLendData] = useState(true);
    const [activeOffer, setActiveOffer] = useState(null);
    const [activeSubscription, setActiveSubscription] = useState(null);
    const [loadingOfferContext, setLoadingOfferContext] = useState(false);
    const [lendDetails, setLendDetails] = useState({
        ...getInitialLendDetails(),
    });

        // State for the "Return Book" functionality
        const [returnBookQuery, setReturnBookQuery] = useState('');
        const [returnBookResults, setReturnBookResults] = useState([]);
        const [loadingReturnSearch, setLoadingReturnSearch] = useState(false);
        const [selectedReturnTransaction, setSelectedReturnTransaction] = useState(null);
        const [returnDetails, setReturnDetails] = useState({
            returnDate: new Date().toISOString().split('T')[0], // Default to today
            isSwap: false,
        });


    // This effect runs when we are redirected back from adding a customer/community
    useEffect(() => {
        if (location.state?.newCommunityId) {
            setCurrentAction('lend'); // Ensure the lend tab is active
            setLendCommunityFilter(location.state.newCommunityId);
        }
        if (location.state?.newCustomer) {
            setCurrentAction('lend'); // Ensure the lend tab is active
            handleSelectCustomer(location.state.newCustomer);
        }
        }, [location.state]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBookData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

        // Handle changes in the "Modify Book" form
        const handleModifyChange = (e) => {
            const { name, value } = e.target;
            setSelectedBook(prevBook => ({
                ...prevBook,
                [name]: value,
            }));
        };

            // Handle changes in the lend transaction details form
    const handleLendDetailsChange = (e) => {
        const { name, value, type, checked } = e.target;
        setLendDetails(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
            ...(
                name === 'offerMode' && ['START_SUBSCRIPTION', 'USE_SUBSCRIPTION'].includes(value)
                    ? { isSwap: false, isPartiallyPaid: false, amountPaid: 0 }
                    : {}
            ),
        }));
        };

        const handleAddBookFromLend = () => {
            setError(null);
            setSuccess(null);
            setReturnToLendAfterAdd(true);
            setCurrentAction('add');
        };

        const loadBookSummary = async (bookId) => {
            if (!bookId) return;
            try {
                setLoadingBookSummary(true);
                setError(null);
                const response = await apiClient.get(`/books/${bookId}/summary`);
                setBookSummary(response.data);
                setSelectedBook(response.data);
                setSearchQuery(response.data.bookName || '');
                setSearchResults([]);
            } catch (err) {
                console.error('Error loading book summary:', err);
                setBookSummary(null);
                setError(err.response?.data?.message || 'Failed to load book summary.');
            } finally {
                setLoadingBookSummary(false);
            }
        };
    
        // Debounced search effect for Modify/Delete/Lend/View tabs
        useEffect(() => {
            if (!['modify', 'delete', 'lend', 'view'].includes(currentAction) || searchQuery.trim() === '') {
                setSearchResults([]);
                setSearchError(null);
                return;
            }

            if (selectedBook && searchQuery === selectedBook.bookName) {
                setSearchResults([]);
                setSearchError(null);
                return;
            }
    
            setLoadingSearch(true);
            setSearchError(null);
            const debounceTimer = setTimeout(async () => {
                try {
                    // Assuming an endpoint like /books/search?q=...
                    const response = await apiClient.get(`/books/search?q=${searchQuery}`);
                    setSearchResults(response.data);
                } catch (err) {
                    console.error("Error searching for books:", err);
                    setSearchError("Failed to search for books. Please check the API.");
                    setSearchResults([]);
                } finally {
                    setLoadingSearch(false);
                }
            }, 300); // 300ms delay before searching
    
            return () => clearTimeout(debounceTimer);
        }, [searchQuery, currentAction, selectedBook]);
      // Effect to fetch communities for the Lend tab filter
      useEffect(() => {
        if (currentAction === 'lend') {
            const fetchCommunities = async () => {
                try {
                    setLoadingLendData(true);
                    const response = await apiClient.get('/communities');
                    setCommunities(response.data);
                } catch (err) {
                    setError('Failed to load communities.');
                } finally {
                    setLoadingLendData(false);
                }
            };
            fetchCommunities();
        }
    }, [currentAction]);

    // Debounced search for customers in the Lend tab
    useEffect(() => {
        if (currentAction !== 'lend' || lendCustomerQuery.trim() === '') {
            setLendCustomerResults([]);
            return;
        }

        const debounceTimer = setTimeout(async () => {
            try {
                // API can filter by communityId if provided
                const communityFilter = lendCommunityFilter ? `&communityId=${lendCommunityFilter}` : '';
                const response = await apiClient.get(`/customers/search?q=${lendCustomerQuery}${communityFilter}`);
                setLendCustomerResults(response.data);
            } catch (err) {
                console.error("Error searching for customers:", err);
                // Handle customer search error if needed
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [lendCustomerQuery, lendCommunityFilter, currentAction]);

    useEffect(() => {
        if (currentAction !== 'lend' || !selectedLendCustomer) {
            setActiveOffer(null);
            setActiveSubscription(null);
            return;
        }

        const fetchOfferContext = async () => {
            const communityId = getCustomerCommunityId(selectedLendCustomer);
            try {
                setLoadingOfferContext(true);
                setError(null);

                const subscriptionRequest = apiClient.get(`/transactions/customers/${selectedLendCustomer.customerId}/active-subscription`);
                const offerRequest = communityId
                    ? apiClient.get(`/offers/community/${communityId}/active?date=${lendDetails.pickupDate}`)
                    : Promise.resolve({ data: null });

                const [subscriptionResponse, offerResponse] = await Promise.all([subscriptionRequest, offerRequest]);
                const subscription = subscriptionResponse.data?.hasActiveSubscription ? subscriptionResponse.data : null;
                const offer = offerResponse.status === 204 ? null : offerResponse.data;

                setActiveSubscription(subscription);
                setActiveOffer(offer || null);
                setLendDetails(prev => ({
                    ...prev,
                    offerMode: subscription?.canUseSubscription ? 'USE_SUBSCRIPTION' : 'NORMAL',
                    isSwap: subscription?.canUseSubscription ? false : prev.isSwap,
                    isPartiallyPaid: subscription?.canUseSubscription ? false : prev.isPartiallyPaid,
                    amountPaid: subscription?.canUseSubscription ? 0 : prev.amountPaid,
                }));
            } catch (err) {
                console.error('Error fetching offer context:', err);
                setActiveOffer(null);
                setActiveSubscription(null);
                setError(err.response?.data?.message || 'Failed to load offer/subscription details for this customer.');
            } finally {
                setLoadingOfferContext(false);
            }
        };

        fetchOfferContext();
    }, [currentAction, selectedLendCustomer, lendDetails.pickupDate]);

    // Debounced search for LENT books in the Return tab
    useEffect(() => {
        if (currentAction !== 'return' || returnBookQuery.trim() === '') {
            setReturnBookResults([]);
            return;
        }
        setLoadingReturnSearch(true);
        const debounceTimer = setTimeout(async () => {
            try {
                // This endpoint should only search for books that are NOT available
                const response = await apiClient.get(`/books/searchlent?q=${returnBookQuery}&status=unavailable`);
                setReturnBookResults(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error("Error searching for lent books:", err);
                setError("Failed to search for lent books. Please check the API.");
                setReturnBookResults([]);
            } finally {
                setLoadingReturnSearch(false);
            }
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [returnBookQuery, currentAction]);

    const handleSelectReturnBook  = async (book) => {
        setError(null);
        setReturnBookQuery(book.bookName);
        setReturnBookResults([]);
        try {
            // This new endpoint gets the active transaction for a specific book
            const response = await apiClient.get(`/transactions/book/${book.bookId}/active`);
            const activeTransaction = Array.isArray(response.data) ? response.data[0] : response.data;
            if (!activeTransaction) {
                throw new Error("No active transaction found for this book.");
            }
            setSelectedReturnTransaction(activeTransaction);
            // Reset return details when a new book is selected
            setReturnDetails({ returnDate: new Date().toISOString().split('T')[0], isSwap: false });
        } catch (err) {
            console.error("Error fetching transaction details:", err);
            setError("Could not find active loan details for this book.");
            setSelectedReturnTransaction(null);
        }
    };


        const handleSelectBook = (book) => {
            const statusName = String(
                book.bookstatus?.statusDesc ||
                book.bookstatus?.statusName ||
                book.bookStatus?.statusDesc ||
                book.bookStatus?.statusName ||
                book.status ||
                ''
            ).toLowerCase();

            if (currentAction === 'lend' && statusName && statusName !== 'available') {
                setError(`"${book.bookName}" is currently unavailable for lending.`);
                setSelectedBook(null);
                setSearchQuery(book.bookName);
                setSearchResults([]);
                return;
            }

            setError(null);
            setSelectedBook(book);
            setSearchQuery(book.bookName);
            setSearchResults([]);
            if (currentAction === 'view') {
                loadBookSummary(book.bookId);
            }
                        // When a book is selected for lending, set its cost as the total amount
            // and reset the payment details.
            if (currentAction === 'lend') {
                setLendDetails({
                    ...getInitialLendDetails(),
                    offerMode: activeSubscription?.canUseSubscription ? 'USE_SUBSCRIPTION' : 'NORMAL',
                });
            }
        };

        const handleClearSelection = () => {
            setSelectedBook(null);
            setBookSummary(null);
            setSearchQuery('');
            setSearchResults([]);
        };
        const handleSelectCustomer = (customer) => {
            setSelectedLendCustomer(customer);
            setLendCustomerQuery(customer.customerName);
            setLendCustomerResults([]);
        };
        useEffect(() => {
            if (location.state?.adminBookAction === 'lend' && location.state?.book) {
                const bookForLend = location.state.book;

                setCurrentAction('lend');
                setError(null);
                setSelectedBook(bookForLend);
                setSearchQuery(bookForLend.bookName || '');
                setSearchResults([]);
                setLendDetails(getInitialLendDetails());
                navigate(location.pathname, { replace: true, state: {} });
            }

            if (location.state?.adminBookAction === 'return' && location.state?.book) {
                setCurrentAction('return');
                handleSelectReturnBook(location.state.book);
                navigate(location.pathname, { replace: true, state: {} });
            }

            if (location.state?.adminBookAction === 'view') {
                const bookId = location.state.bookId || location.state.book?.bookId;
                setCurrentAction('view');
                if (bookId) {
                    loadBookSummary(bookId);
                }
                navigate(location.pathname, { replace: true, state: {} });
            }
        }, [location.state]);



    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            // Assuming the API expects lendingCost as a number
            const payload = {
                ...bookData,
                purchasePrice: parseFloat(bookData.purchasePrice) || 0,
                purchaseDate: bookData.purchaseDate || null,
                lendingCost: parseFloat(bookData.lendingCost) || 0,
            };
            const response = await apiClient.post('/books', payload);
            const newBook = response.data;

            setBookData({
                bookName: '',
                author: '',
                genre: '',
                purchasePrice: '',
                purchaseDate: getTodayInputValue(),
                lendingCost: '',
                coverImageUrl: '',
            });

            if (returnToLendAfterAdd) {
                setSelectedBook(newBook);
                setSearchQuery(newBook?.bookName || bookData.bookName);
                setSearchResults([]);
                setLendDetails(getInitialLendDetails());
                setReturnToLendAfterAdd(false);
                setCurrentAction('lend');
                setSuccess(`Book "${newBook?.bookName || bookData.bookName}" added and selected for lending.`);
                return;
            }

            setSuccess('Book added successfully! Redirecting...');
            setTimeout(() => navigate('/browse'), 2000);
        } catch (err) {
            console.error("Error adding book:", err);
            setError(err.response?.data?.message || "Failed to add book. Please check the details.");
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!selectedBook) {
            setError("No book selected to update.");
            return;
        }
        setError(null);
        setSuccess(null);

                // Client-side validation to prevent sending empty required fields
                if (!selectedBook.bookName.trim() || !selectedBook.author.trim() || !selectedBook.genre.trim()) {
                    setError("Book Name, Author, and Genre cannot be empty.");
                    return;
                }

        try {
            const payload = {
                ...selectedBook,
                purchasePrice: parseFloat(selectedBook.purchasePrice) || 0,
                lendingCost: parseFloat(selectedBook.lendingCost) || 0,
            };
            await apiClient.put(`/books/${selectedBook.bookId}`, payload);
            setSuccess('Book updated successfully!');
            setTimeout(() => {
                setSelectedBook(null);
                setSearchQuery('');
            }, 2000);
        } catch (err) {
            console.error("Error updating book:", err);
            setError(err.response?.data?.message || "Failed to update book.");
        }
    };

    const handleDelete = async () => {
        if (!selectedBook) {
            setError("No book selected to delete.");
            return;
        }

        // Add a confirmation dialog as a safety measure
        if (!window.confirm(`Are you sure you want to delete "${selectedBook.bookName}"? This action cannot be undone.`)) {
            return;
        }

        setError(null);
        setSuccess(null);

        try {
            await apiClient.put(`/books/remove/${selectedBook.bookId}`);
            setSuccess('Book deleted successfully!');
            handleClearSelection(); // Clear the form
        } catch (err) {
            console.error("Error deleting book:", err);
            setError(err.response?.data?.message || "Failed to delete book.");
        }
    };
    const handleLendSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBook || !selectedLendCustomer) {
            setError("Please select both a book and a customer.");
            return;
        }
        setError(null);
        setSuccess(null);

        if (activeSubscription && !activeSubscription.canUseSubscription) {
            setError("This customer has an active subscription that cannot take another book yet. Close it by returning all used books, or wait until it expires.");
            return;
        }

        const selectedOfferMode = activeSubscription?.canUseSubscription
            ? 'USE_SUBSCRIPTION'
            : lendDetails.offerMode;
        const effectiveLendDetails = {
            ...lendDetails,
            offerMode: selectedOfferMode,
        };

        try {
            const isSubscriptionMode = ['START_SUBSCRIPTION', 'USE_SUBSCRIPTION'].includes(selectedOfferMode);
            const preview = getOfferPreview(selectedBook, effectiveLendDetails, activeOffer, activeSubscription);
                        // Construct the full payload expected by the backend
                        const payload = {
                bookId: selectedBook.bookId,
                customerId: selectedLendCustomer.customerId,
                pickupDate: lendDetails.pickupDate,
                totalAmount: selectedBook.lendingCost,
                swap: isSubscriptionMode ? false : lendDetails.isSwap,
                partiallyPaid: isSubscriptionMode ? false : lendDetails.isPartiallyPaid,
                amountPaid: isSubscriptionMode ? preview.amountPaid : parseFloat(lendDetails.amountPaid) || 0,
            };

            if (selectedOfferMode === 'PERCENT' || selectedOfferMode === 'START_SUBSCRIPTION') {
                payload.offerId = activeOffer?.offerId;
            }

            if (selectedOfferMode === 'USE_SUBSCRIPTION') {
                payload.subscriptionTxnId = activeSubscription?.subscriptionTxnId;
            }

            // Call the correct endpoint
            await apiClient.post('/transactions/lend', payload);

            setSuccess(`Successfully lent "${selectedBook.bookName}" to ${selectedLendCustomer.customerName}.`);
            handleClearSelection();
            setSelectedLendCustomer(null);
            setActiveOffer(null);
            setActiveSubscription(null);
            setLendDetails(getInitialLendDetails());

        } catch (err) {
            setError(err.response?.data?.message || "Failed to process transaction. Check API and payload.");
        }
    };

    const handleReturnSubmit = async (e) => {
        e.preventDefault();
        if (!selectedReturnTransaction) {
            setError("Please select a book to return.");
            return;
        }
        setError(null);
        setSuccess(null);
        const summary = calculateReturnSummary(selectedReturnTransaction, returnDetails);

        try {
            const payload = {
                returnDate: returnDetails.returnDate,
                swap: returnDetails.isSwap,
                // You can add partial payment logic here if needed
            };
            // This new endpoint will handle the return logic
            await apiClient.put(`/transactions/${selectedReturnTransaction.bookId}/return`, payload);
            setSuccess(`Book returned successfully! To be paid: Rs. ${summary.balanceDue.toFixed(2)}.`);

            // Reset the state
            setReturnBookQuery('');
            setSelectedReturnTransaction(null);
            setReturnDetails({ returnDate: new Date().toISOString().split('T')[0], isSwap: false });

        } catch (err) {
            console.error("Error returning book:", err);
            setError(err.response?.data?.message || "Failed to process return.");
        }
    };

    const selectedOfferMode = activeSubscription?.canUseSubscription
        ? 'USE_SUBSCRIPTION'
        : lendDetails.offerMode;
    const effectiveLendDetails = {
        ...lendDetails,
        offerMode: selectedOfferMode,
    };
    const lendPreview = getOfferPreview(selectedBook, effectiveLendDetails, activeOffer, activeSubscription);
    const isSubscriptionMode = ['START_SUBSCRIPTION', 'USE_SUBSCRIPTION'].includes(selectedOfferMode);
    const isLendBlockedBySubscription = Boolean(activeSubscription && !activeSubscription.canUseSubscription);

    return (
        <div className={`admin-form-container ${currentAction === 'view' ? 'summary-container' : ''}`}>

<div className="action-tabs">
                <button onClick={() => setCurrentAction('add')} className={currentAction === 'add' ? 'active' : ''}>Add Book</button>
                <button onClick={() => setCurrentAction('modify')} className={currentAction === 'modify' ? 'active' : ''}>Modify Book</button>
                <button onClick={() => setCurrentAction('delete')} className={currentAction === 'delete' ? 'active' : ''}>Delete Book</button>
                <button onClick={() => setCurrentAction('lend')} className={currentAction === 'lend' ? 'active' : ''}>Lend Book</button>
                <button onClick={() => setCurrentAction('return')} className={currentAction === 'return' ? 'active' : ''}>Return Book</button>
                <button onClick={() => setCurrentAction('view')} className={currentAction === 'view' ? 'active' : ''}>View Book</button>

            </div>
            <Link to="/" className="back-link">&larr; Back to Dashboard</Link>
            {currentAction === 'add' && (
                <>
                    <h1>Add a New Book</h1>
                    {returnToLendAfterAdd && (
                        <button
                            type="button"
                            className="add-new-link-inline inline-link-button"
                            onClick={() => {
                                setReturnToLendAfterAdd(false);
                                setCurrentAction('lend');
                            }}
                        >
                            Back to Lend Book
                        </button>
                    )}
                    <form onSubmit={handleSubmit} className="admin-form">
                        {/* ... Add Book form fields ... */}
                        <div className="form-group">
                            <label htmlFor="bookName">Book Name</label>
                            <input type="text" id="bookName" name="bookName" value={bookData.bookName} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="author">Author</label>
                            <input type="text" id="author" name="author" value={bookData.author} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="genre">Genre</label>
                            <input type="text" id="genre" name="genre" value={bookData.genre} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lendingCost">Lending Cost (Rs. per week)</label>
                            <input type="number" id="lendingCost" name="lendingCost" value={bookData.lendingCost} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="purchasePrice">Purchase Cost (Rs.)</label>
                            <input type="number" id="purchasePrice" name="purchasePrice" value={bookData.purchasePrice} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="purchaseDate">Purchase Date</label>
                            <input type="date" id="purchaseDate" name="purchaseDate" value={bookData.purchaseDate} onChange={handleChange} required />
                        </div>
                        <button type="submit" className="submit-button">Add Book</button>
                    </form>
                </>
            )}

            {currentAction === 'modify' && (
                <>
                    <h1>Modify Book Details</h1>
                    <div className="search-container">
                        <label htmlFor="searchQuery">Search for a Book to Modify</label>
                        <input
                            type="text"
                            id="searchQuery"
                            name="searchQuery"
                            placeholder="Start typing a book name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoComplete="off"
                        />
                        {selectedBook && <button type="button" className="clear-selection-btn" onClick={handleClearSelection}>&times;</button>}
                        {loadingSearch && <div className="loader"></div>}
                        {!loadingSearch && searchResults.length > 0 && (
                            <ul className="search-results">
                                {searchResults.map(book => (
                                    <li key={book.bookId} onClick={() => handleSelectBook(book)}>
                                        {book.bookName}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!loadingSearch && searchResults.length === 0 && searchQuery.trim() !== '' && !searchError && !selectedBook && (
                            <ul className="search-results">
                                <li className="no-results">No books found</li>
                            </ul>
                        )}
                        {searchError && <p className="error-message" style={{ marginTop: '0.5rem' }}>{searchError}</p>}
                    </div>

                    {selectedBook && (
                        <form onSubmit={handleUpdate} className="admin-form">
                            <div className="form-group">
                                <label htmlFor="bookName">Book Name</label>
                                <input type="text" id="bookName" name="bookName" value={selectedBook.bookName} onChange={handleModifyChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="author">Author</label>
                                <input type="text" id="author" name="author" value={selectedBook.author} onChange={handleModifyChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="genre">Genre</label>
                                <input type="text" id="genre" name="genre" value={selectedBook.genre} onChange={handleModifyChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lendingCost">Lending Cost (Rs. per week)</label>
                                <input type="number" id="lendingCost" name="lendingCost" value={selectedBook.lendingCost} onChange={handleModifyChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="purchasePrice">Purchase Cost (Rs.)</label>
                                <input type="number" id="purchasePrice" name="purchasePrice" value={selectedBook.purchasePrice} onChange={handleModifyChange} required />
                            </div>
                            <button type="submit" className="submit-button">Update Book</button>
                        </form>
                    )}
                </>
            )}

            {/* Placeholders for other actions */}
            {currentAction === 'delete' && (
                <>
                    <h1>Delete a Book</h1>
                    <div className="search-container">
                        <label htmlFor="searchQuery">Search for a Book to Delete</label>
                        <input type="text" id="searchQuery" name="searchQuery" placeholder="Start typing a book name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoComplete="off" />
                        {selectedBook && <button type="button" className="clear-selection-btn" onClick={handleClearSelection}>&times;</button>}
                        {loadingSearch && <div className="loader"></div>}
                        {!loadingSearch && searchResults.length > 0 && ( <ul className="search-results">{searchResults.map(book => (<li key={book.bookId} onClick={() => handleSelectBook(book)}>{book.bookName}</li>))}</ul> )}
                        {!loadingSearch && searchResults.length === 0 && searchQuery.trim() !== '' && !searchError && !selectedBook && ( <ul className="search-results"><li className="no-results">No books found</li></ul> )}
                        {searchError && <p className="error-message" style={{ marginTop: '0.5rem' }}>{searchError}</p>}
                    </div>

                    {selectedBook && (
                        <div className="book-details-display">
                            <h3>{selectedBook.bookName}</h3>
                            <p><strong>Author:</strong> {selectedBook.author}</p>
                            <p><strong>Genre:</strong> {selectedBook.genre}</p>
                            <button onClick={handleDelete} className="submit-button delete-button">Delete This Book</button>
                        </div>
                    )}
                </>
            )}
 {currentAction === 'lend' && (
                <>
                    <h1>Lend a Book</h1>
                    <form onSubmit={handleLendSubmit} className="admin-form">
                        {/* Customer Search Section */}
                        <fieldset>
                            <legend>1. Find a Customer</legend>
                            <div className="form-group">
                                <label htmlFor="communityFilter">Filter by Community (Optional)</label>
                                <select id="communityFilter" name="communityFilter" value={lendCommunityFilter} onChange={(e) => setLendCommunityFilter(e.target.value)} disabled={loadingLendData}>
                                    <option value="">All Communities</option>
                                    {communities.map(c => <option key={c.communityId} value={c.communityId}>{c.communityName}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="lendCustomerQuery">Search Customer Name</label>
                                <div className="search-container">
                                    <input type="text" id="lendCustomerQuery" value={lendCustomerQuery} onChange={(e) => setLendCustomerQuery(e.target.value)} placeholder="Start typing customer name..." autoComplete="off" />
                                    {lendCustomerResults.length > 0 && (
                                        <ul className="search-results">{lendCustomerResults.map(c => <li key={c.customerId} onClick={() => handleSelectCustomer(c)}>{c.customerName}</li>)}</ul>
                                    )}
                                </div>
                                <Link to="/admin/add-customer" state={{ from: location.pathname }} className="add-new-link-inline">Or Add New Customer</Link>
                            </div>
                            {selectedLendCustomer && (
                                <div className="selection-display">
                                    Selected Customer: <strong>{selectedLendCustomer.customerName}</strong>
                                </div>
                            )}
                        </fieldset>

                        {/* Book Search Section */}
                        <fieldset>
                            <legend>2. Find an Available Book</legend>
                            <div className="form-group">
                                <label htmlFor="searchQuery">Search Book Name</label>
                                <div className="search-container">
                                    <input type="text" id="searchQuery" name="searchQuery" placeholder="Start typing a book name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoComplete="off" />
                                    {selectedBook && <button type="button" className="clear-selection-btn" onClick={handleClearSelection}>&times;</button>}
                                    {loadingSearch && <div className="loader"></div>}
                                    {!loadingSearch && searchResults.length > 0 && (
                                        <ul className="search-results">{searchResults.map(book => (<li key={book.bookId} onClick={() => handleSelectBook(book)}>{book.bookName}</li>))}</ul>
                                    )}
                                    {!loadingSearch && searchResults.length === 0 && searchQuery.trim() !== '' && !searchError && !selectedBook && (
                                        <ul className="search-results"><li className="no-results">No available books found</li></ul>
                                    )}
                                </div>
                                <button type="button" className="add-new-link-inline inline-link-button" onClick={handleAddBookFromLend}>Or Add New Book</button>
                            </div>
                            {selectedBook && (
                                <div className="selection-display">
                                    Selected Book: <strong>{selectedBook.bookName}</strong>
                                </div>
                            )}
                        </fieldset>

                        <fieldset>
                            <legend>3. Offer / Subscription</legend>
                            {loadingOfferContext && <p>Checking customer offers...</p>}
                            {!loadingOfferContext && selectedLendCustomer && (
                                <>
                                    {activeSubscription && (
                                        <div className="offer-context-card">
                                            <strong>Active Subscription</strong>
                                            <p>{activeSubscription.offerName}</p>
                                            <p>
                                                Books used: {activeSubscription.booksUsed || 0} / {activeSubscription.bundleBookLimit || 0}
                                                {' | '}Currently with customer: {activeSubscription.openBooks || 0}
                                            </p>
                                            <p>
                                                Paid: {currency.format(Number(activeSubscription.amountPaid) || 0)}
                                                {' | '}Valid till: {activeSubscription.subscriptionEndDate || '-'}
                                            </p>
                                            {!activeSubscription.canUseSubscription && (
                                                <p className="offer-warning">This subscription cannot take another book. Return all used books to close it before starting a new lend.</p>
                                            )}
                                        </div>
                                    )}

                                    {activeOffer && !activeSubscription && (
                                        <div className="offer-context-card">
                                            <strong>Community Offer Available</strong>
                                            <p>{activeOffer.offerName}</p>
                                            <p>{describeOffer(activeOffer)}</p>
                                        </div>
                                    )}

                                    {!activeOffer && !activeSubscription && (
                                        <p>No active offer/subscription found for this customer.</p>
                                    )}

                                    <div className="offer-mode-list">
                                        {!activeSubscription && (
                                            <label className="radio-group">
                                                <input
                                                    type="radio"
                                                    name="offerMode"
                                                    value="NORMAL"
                                                    checked={lendDetails.offerMode === 'NORMAL'}
                                                    onChange={handleLendDetailsChange}
                                                />
                                                Normal Lending
                                            </label>
                                        )}

                                        {activeSubscription?.canUseSubscription && (
                                            <label className="radio-group">
                                                <input
                                                    type="radio"
                                                    name="offerMode"
                                                    value="USE_SUBSCRIPTION"
                                                    checked={selectedOfferMode === 'USE_SUBSCRIPTION'}
                                                    onChange={handleLendDetailsChange}
                                                />
                                                Use Active Subscription
                                            </label>
                                        )}

                                        {activeOffer?.offerType === 'PERCENT' && !activeSubscription && (
                                            <label className="radio-group">
                                                <input
                                                    type="radio"
                                                    name="offerMode"
                                                    value="PERCENT"
                                                    checked={lendDetails.offerMode === 'PERCENT'}
                                                    onChange={handleLendDetailsChange}
                                                />
                                                Apply Percentage Offer
                                            </label>
                                        )}

                                        {activeOffer?.offerType === 'BUNDLE' && !activeSubscription && (
                                            <label className="radio-group">
                                                <input
                                                    type="radio"
                                                    name="offerMode"
                                                    value="START_SUBSCRIPTION"
                                                    checked={lendDetails.offerMode === 'START_SUBSCRIPTION'}
                                                    onChange={handleLendDetailsChange}
                                                />
                                                Start Subscription
                                            </label>
                                        )}
                                    </div>
                                </>
                            )}
                            {!selectedLendCustomer && <p>Select a customer to check offers.</p>}
                        </fieldset>

                         {/* Transaction Details Section */}
                         <fieldset>
                            <legend>4. Transaction Details</legend>
                            <div className="form-group">
                                <label htmlFor="pickupDate">Lend Date</label>
                                <input type="date" id="pickupDate" name="pickupDate" value={lendDetails.pickupDate} onChange={handleLendDetailsChange} required />
                            </div>
                            <div className="form-group">
                                <label>Lending Amount per week: Rs. {selectedBook ? selectedBook.lendingCost : '0.00'}</label>
                            </div>
                            <div className="offer-preview">
                                <span>{lendPreview.label}</span>
                                <strong>{currency.format(lendPreview.totalAmount)}</strong>
                                {isSubscriptionMode && (
                                    <small>Book revenue for P&amp;L: {currency.format(lendPreview.bookRevenueAmount)}</small>
                                )}
                            </div>
                            <div className="form-group form-group-inline">
                                <input type="checkbox" id="isSwap" name="isSwap" checked={lendDetails.isSwap} onChange={handleLendDetailsChange} disabled={isSubscriptionMode} />
                                <label htmlFor="isSwap">Is this a book swap?</label>
                            </div>
                            <div className="form-group form-group-inline">
                                <input type="checkbox" id="isPartiallyPaid" name="isPartiallyPaid" checked={lendDetails.isPartiallyPaid} onChange={handleLendDetailsChange} disabled={isSubscriptionMode} />
                                <label htmlFor="isPartiallyPaid">Is this a partial payment?</label>
                            </div>
                            {lendDetails.isPartiallyPaid && (
                                <div className="form-group">
                                    <label htmlFor="amountPaid">Amount Paid (Rs.)</label>
                                    <input type="number" id="amountPaid" name="amountPaid" value={lendDetails.amountPaid} min="0" onChange={handleLendDetailsChange} required />
                                </div>
                            )}
                        </fieldset>

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={!selectedBook || !selectedLendCustomer || loadingOfferContext || isLendBlockedBySubscription}
                        >
                            Lend Book
                        </button>
                    </form>
                </>
            )}
            {currentAction === 'view' && (
                <>
                    <h1>View Book</h1>
                    <div className="search-container">
                        <label htmlFor="searchQuery">Search for a Book to View</label>
                        <input
                            type="text"
                            id="searchQuery"
                            name="searchQuery"
                            placeholder="Start typing a book name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoComplete="off"
                        />
                        {selectedBook && <button type="button" className="clear-selection-btn" onClick={handleClearSelection}>&times;</button>}
                        {loadingSearch && <div className="loader"></div>}
                        {!loadingSearch && searchResults.length > 0 && (
                            <ul className="search-results">
                                {searchResults.map(book => (
                                    <li key={book.bookId} onClick={() => handleSelectBook(book)}>{book.bookName}</li>
                                ))}
                            </ul>
                        )}
                        {!loadingSearch && searchResults.length === 0 && searchQuery.trim() !== '' && !searchError && !selectedBook && (
                            <ul className="search-results"><li className="no-results">No books found</li></ul>
                        )}
                        {searchError && <p className="error-message" style={{ marginTop: '0.5rem' }}>{searchError}</p>}
                    </div>
                    {loadingBookSummary && <p>Loading book summary...</p>}
                    {!loadingBookSummary && bookSummary && <BookSummaryView summary={bookSummary} />}
                </>
            )}
            {currentAction === 'return' && (
                <>
                    <h1>Return a Book</h1>
                    <form onSubmit={handleReturnSubmit} className="admin-form">
                        <fieldset>
                            <legend>1. Find a Lent Book</legend>
                            <div className="form-group">
                                <label htmlFor="returnBookQuery">Search Book Name</label>
                                <div className="search-container">
                                    <input type="text" id="returnBookQuery" value={returnBookQuery} onChange={(e) => setReturnBookQuery(e.target.value)} placeholder="Start typing a lent book's name..." autoComplete="off" />
                                    {loadingReturnSearch && <div className="loader"></div>}
                                    {returnBookResults.length > 0 && (
                                        <ul className="search-results">
                                            {returnBookResults.map(book => <li key={book.bookId} onClick={() => handleSelectReturnBook(book)}>{book.bookName}</li>)}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </fieldset>

                        {selectedReturnTransaction && (
                            <>
                                <fieldset>
                                    <legend>2. Borrower Details</legend>
                                    <div className="details-group">
                                        <label>Customer Name:</label>
                                        <span>{selectedReturnTransaction?.customerName}</span>
                                    </div>
                                    <div className="details-group">
                                        <label>Contact Number:</label>
                                        <span>{selectedReturnTransaction?.mobileNumber}</span>
                                    </div>
                                </fieldset>

                                <fieldset>
                                    <legend>3. Return Details</legend>
                                    <div className="form-group">
                                        <label htmlFor="returnDate">Return Date</label>
                                        <input type="date" id="returnDate" name="returnDate" value={returnDetails.returnDate} min={selectedReturnTransaction.pickupDate} onChange={(e) => setReturnDetails(p => ({ ...p, returnDate: e.target.value }))} />
                                    </div>
                                    <div className="form-group form-group-inline">
                                        <input type="checkbox" id="returnIsSwap" name="isSwap" checked={returnDetails.isSwap} onChange={(e) => setReturnDetails(p => ({ ...p, isSwap: e.target.checked }))} />
                                        <label htmlFor="returnIsSwap">Book was swapped?</label>
                                    </div>
                                    <div className="form-group">
                                        {(() => {
                                            const summary = calculateReturnSummary(selectedReturnTransaction, returnDetails);

                                            return (
                                                <>
                                                    {summary.isSubscription ? (
                                                        <>
                                                            <label>Subscription:</label>
                                                            <p>{selectedReturnTransaction.offerName || selectedReturnTransaction.subscriptionTxnId}</p>
                                                            <label>Book Count:</label>
                                                            <p>{selectedReturnTransaction.bundleBookNo} / {selectedReturnTransaction.bundleBookLimit}</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <label>Duration:</label>
                                                            <p>{summary.billedWeeks} week{summary.billedWeeks === 1 ? '' : 's'}</p>
                                                            <label>Total Lending Amount:</label>
                                                            <p>Rs. {summary.totalCost.toFixed(2)}</p>
                                                        </>
                                                    )}
                                                    <label>Amount Paid:</label>
                                                    <p>Rs. {summary.amountPaid.toFixed(2)}</p>
                                                    <label>To Be Paid:</label>
                                                    <p className="calculated-cost">Rs. {summary.balanceDue.toFixed(2)}</p>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </fieldset>
                                <button type="submit" className="submit-button">Process Return</button>
                            </>
                        )}
                    </form>
                </>
            )}
            {success && <p className="success-message">{success}</p>}
            {error && <p className="error-message">{error}</p>}
        </div>


    );
};

export default BookActionsPage;
