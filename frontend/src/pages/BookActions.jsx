import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import apiClient from '../services/api';
import './AdminForms.css';
import './BookActions.css'; // We'll create this for new styles



//Adding, Modifying, Deleting & Lending Books
const BookActionsPage = () => {
    // State for the "Add Book" form
    const [bookData, setBookData] = useState({
        bookName: '',
        author: '',
        genre: '',
        purchasePrice: '',
        lendingCost: '',
        coverImageUrl: '',
    });

        // State for the "Modify Book" functionality
        const [currentAction, setCurrentAction] = useState('add');
        const [searchQuery, setSearchQuery] = useState('');
        const [searchResults, setSearchResults] = useState([]);
        const [selectedBook, setSelectedBook] = useState(null);
        const [loadingSearch, setLoadingSearch] = useState(false);
        const [searchError, setSearchError] = useState(null);

    
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
    const [lendDetails, setLendDetails] = useState({
        isSwap: false,
        isPartiallyPaid: false,
        amountPaid: 0,
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
        // If we came back from adding a customer for the return flow
        if (location.state?.returnFlowCustomer) {
            handleSelectReturnCustomer(location.state.returnFlowCustomer);
        
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
            }));
        };
    
        // Debounced search effect for Modify/Delete tabs
        useEffect(() => {
            if (searchQuery.trim() === '') {
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
        }, [searchQuery]);
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
                setReturnBookResults(response.data);
            } catch (err) {
                console.error("Error searching for lent books:", err);
            } finally {
                setLoadingReturnSearch(false);
            }
        }, 300);
        return () => clearTimeout(debounceTimer);
    }, [returnBookQuery, currentAction]);

    const handleSelectReturnBook  = async (book) => {
        setReturnBookQuery(book.bookName);
        setReturnBookResults([]);
        try {
            // This new endpoint gets the active transaction for a specific book
            const response = await apiClient.get(`/transactions/book/${book.bookId}/active`);
            setSelectedReturnTransaction(response.data);
            // Reset return details when a new book is selected
            //setReturnDetails({ returnDate: new Date().toISOString().split('T')[0], isSwap: false });
        } catch (err) {
            console.error("Error fetching transaction details:", err);
            setError("Could not find active loan details for this book.");
            setSelectedReturnTransaction(null);
        }
    };


        const handleSelectBook = (book) => {
            setSelectedBook(book);
            setSearchQuery(book.bookName);
            setSearchResults([]);
                        // When a book is selected for lending, set its cost as the total amount
            // and reset the payment details.
            if (currentAction === 'lend') {
                setLendDetails({ isSwap: false, isPartiallyPaid: false, amountPaid: 0 });
            }
        };

        const handleClearSelection = () => {
            setSelectedBook(null);
            setSearchQuery('');
            setSearchResults([]);
        };
        const handleSelectCustomer = (customer) => {
            setSelectedLendCustomer(customer);
            setLendCustomerQuery(customer.customerName);
            setLendCustomerResults([]);
        };
        const handleSelectReturnCustomer = (customer) => {
            setCurrentAction('return');
            setSelectedReturnCustomer(customer);
            setReturnCustomerQuery(customer.customerName);
            setReturnCustomerResults([]);
        };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            // Assuming the API expects lendingCost as a number
            const payload = {
                ...bookData,
                purchasePrice: parseFloat(bookData.purchasePrice) || 0,
                lendingCost: parseFloat(bookData.lendingCost) || 0,
            };
            await apiClient.post('/books', payload);
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

        try {
                        // Construct the full payload expected by the backend
                        const payload = {
                bookId: selectedBook.bookId,
                customerId: selectedLendCustomer.customerId,
                totalAmount: selectedBook.lendingCost,
                swap: lendDetails.isSwap,
                partiallyPaid: lendDetails.isPartiallyPaid,
                amountPaid: parseFloat(lendDetails.amountPaid) || 0,
            };

            // Call the correct endpoint
            await apiClient.post('/transactions/lend', payload);

            setSuccess(`Successfully lent "${selectedBook.bookName}" to ${selectedLendCustomer.customerName}.`);
            handleClearSelection();
            setSelectedLendCustomer(null);
            setLendDetails({ isSwap: false, isPartiallyPaid: false, amountPaid: 0 }); // Reset form

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

        // Calculate the final cost based on swap status
        const weeks = Math.ceil((new Date(returnDetails.returnDate) - new Date(selectedReturnTransaction.pickupDate)) / (1000 * 60 * 60 * 24 * 7));
        let finalCost = (selectedReturnTransaction.lendingCost || 0) * Math.max(1, weeks);
        if (returnDetails.isSwap) {
            finalCost /= 2;
        }

        try {
            const payload = {
                returnDate: returnDetails.returnDate,
                finalCost: finalCost,
                isSwap: returnDetails.isSwap,
                // You can add partial payment logic here if needed
            };
            // This new endpoint will handle the return logic
            await apiClient.put(`/transactions/return/${selectedReturnTransaction.transactionId}`, payload);
            setSuccess("Book returned successfully!");

            // Reset the state
            setReturnBookQuery('');
            setSelectedReturnTransaction(null);
            setReturnDetails({ returnDate: new Date().toISOString().split('T')[0], isSwap: false });

        } catch (err) {
            console.error("Error returning book:", err);
            setError(err.response?.data?.message || "Failed to process return.");
        }
    };

    return (
        <div className="admin-form-container">

<div className="action-tabs">
                <button onClick={() => setCurrentAction('add')} className={currentAction === 'add' ? 'active' : ''}>Add Book</button>
                <button onClick={() => setCurrentAction('modify')} className={currentAction === 'modify' ? 'active' : ''}>Modify Book</button>
                <button onClick={() => setCurrentAction('delete')} className={currentAction === 'delete' ? 'active' : ''}>Delete Book</button>
                <button onClick={() => setCurrentAction('lend')} className={currentAction === 'lend' ? 'active' : ''}>Lend Book</button>
                <button onClick={() => setCurrentAction('return')} className={currentAction === 'return' ? 'active' : ''}>Return Book</button>

            </div>
            <Link to="/" className="back-link">&larr; Back to Dashboard</Link>
            {currentAction === 'add' && (
                <>
                    <h1>Add a New Book</h1>
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
                            <label htmlFor="lendingCost">Lending Cost (Rs.)</label>
                            <input type="number" id="lendingCost" name="lendingCost" value={bookData.lendingCost} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="purchasePrice">Purchase Cost (Rs.)</label>
                            <input type="number" id="purchasePrice" name="purchasePrice" value={bookData.purchasePrice} onChange={handleChange} required />
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
                                <label htmlFor="lendingCost">Lending Cost (Rs.)</label>
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
                            </div>
                            {selectedBook && (
                                <div className="selection-display">
                                    Selected Book: <strong>{selectedBook.bookName}</strong>
                                </div>
                            )}
                        </fieldset>

                         {/* Transaction Details Section */}
                         <fieldset>
                            <legend>3. Transaction Details</legend>
                            <div className="form-group">
                                <label>Total Amount: Rs. {selectedBook ? selectedBook.lendingCost : '0.00'}</label>
                            </div>
                            <div className="form-group form-group-inline">
                                <input type="checkbox" id="isSwap" name="isSwap" checked={lendDetails.isSwap} onChange={handleLendDetailsChange} />
                                <label htmlFor="isSwap">Is this a book swap?</label>
                            </div>
                            <div className="form-group form-group-inline">
                                <input type="checkbox" id="isPartiallyPaid" name="isPartiallyPaid" checked={lendDetails.isPartiallyPaid} onChange={handleLendDetailsChange} />
                                <label htmlFor="isPartiallyPaid">Is this a partial payment?</label>
                            </div>
                            {lendDetails.isPartiallyPaid && (
                                <div className="form-group">
                                    <label htmlFor="amountPaid">Amount Paid (Rs.)</label>
                                    <input type="number" id="amountPaid" name="amountPaid" value={lendDetails.amountPaid} onChange={handleLendDetailsChange} />
                                </div>
                            )}
                        </fieldset>

                        <button
                            type="submit"
                            className="submit-button"
                            disabled={!selectedBook || !selectedLendCustomer}
                        >
                            Lend Book
                        </button>
                    </form>
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
                                            {returnBookResults.map(book => <li key={book.bookId} onClick={() => handleSelectLentBook(book)}>{book.bookName}</li>)}
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
                                        <input type="date" id="returnDate" name="returnDate" value={returnDetails.returnDate} onChange={(e) => setReturnDetails(p => ({ ...p, returnDate: e.target.value }))} />
                                    </div>
                                    <div className="form-group form-group-inline">
                                        <input type="checkbox" id="returnIsSwap" name="isSwap" checked={returnDetails.isSwap} onChange={(e) => setReturnDetails(p => ({ ...p, isSwap: e.target.checked }))} />
                                        <label htmlFor="returnIsSwap">Book was swapped?</label>
                                    </div>
                                    <div className="form-group">
                                        <label>Calculated Cost:</label>
                                        <p className="calculated-cost">
                                            Rs. {
                                                (() => {
                                                    const weeks = Math.ceil((new Date(returnDetails.returnDate) - new Date(selectedReturnTransaction.pickupDate)) / (1000 * 60 * 60 * 24 * 7));
                                                    let cost = (selectedReturnTransaction.lendingCost || 0) * Math.max(1, weeks);
                                                    if (returnDetails.isSwap) cost /= 2;
                                                    return cost.toFixed(2);
                                                })()
                                            }
                                        </p>
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
