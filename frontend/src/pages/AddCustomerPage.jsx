import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import apiClient from '../services/api';
import './AdminForms.css';

const AddCustomerPage = () => {
    // Updated state for all required fields
    const [customerData, setCustomerData] = useState({
        customerName: '',
        blockNumber: '',
        unitNumber: '',
        mobileNumber: '',
        communityId: '', // Will store the ID from the dropdown
    });
    // State for the communities dropdown
    const [communities, setCommunities] = useState([]);
    const [loadingCommunities, setLoadingCommunities] = useState(true);

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

        // This effect runs when we are redirected back to this page
    // It checks for state passed from the AddCommunityPage
    useEffect(() => {
        if (location.state?.customerData) {
            setCustomerData(location.state.customerData);
        }
        if (location.state?.newCommunityId) {
            // Pre-select the newly created community
            setCustomerData(prevData => ({ ...prevData, communityId: location.state.newCommunityId }));
        }
    }, [location.state]);



    // Fetch communities for the dropdown when the component mounts
    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                setLoadingCommunities(true);
                const response = await apiClient.get('/communities');
                setCommunities(response.data);
            } catch (err) {
                console.error("Error fetching communities:", err);
                setError("Failed to load communities. Please try again.");
            } finally {
                setLoadingCommunities(false);
            }
        };

        fetchCommunities();
    }, []); // Empty array ensures this runs only once

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCustomerData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Basic validation
        if (!customerData.communityId) {
            setError("Please select a community.");
            return;
        }

        try {
            // Ensure communityId is a number before sending
            const payload = {
                ...customerData,
                communityId: parseInt(customerData.communityId, 10),
            };
            const response = await apiClient.post('/customers', payload);
            const newCustomer = response.data;            
            
            setSuccess('Customer added successfully! Redirecting...');
            //setTimeout(() => navigate('/'), 2000); // Redirect to dashboard
                    // If we were sent here from another page, navigate back with the new customer data
                    if (location.state?.from) {
                        navigate(location.state.from, {
                            state: { newCustomer: newCustomer },
                            replace: true // Avoids adding this page to history
                        });
                    } else {
                        setTimeout(() => navigate('/'), 2000); // Default redirect to dashboard
                    }
        } catch (err) {
            console.error("Error adding customer:", err);
            setError(err.response?.data?.message || "Failed to add customer. Please check the details.");
        }
    };

    return (
        <div className="admin-form-container">
            <Link to="/" className="back-link">&larr; Back to Dashboard</Link>
            <h1>Add a New Customer</h1>
            <form onSubmit={handleSubmit} className="admin-form">
                <div className="form-group">
                    <label htmlFor="customerName">Customer Name</label>
                    <input
                        type="text"
                        id="customerName"
                        name="customerName"
                        value={customerData.customerName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="blockNumber">Block Number</label>
                    <input
                        type="text"
                        id="blockNumber"
                        name="blockNumber"
                        value={customerData.blockNumber}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="unitNumber">Unit Number</label>
                    <input
                        type="text"
                        id="unitNumber"
                        name="unitNumber"
                        value={customerData.unitNumber}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="mobileNumber">Mobile Number</label>
                    <input
                        type="tel" // Use type="tel" for mobile numbers
                        id="mobileNumber"
                        name="mobileNumber"
                        value={customerData.mobileNumber}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="communityId">Community</label>
                    <div className="community-input-group">
                        <select
                            id="communityId"
                            name="communityId"
                            value={customerData.communityId}
                            onChange={handleChange}
                            required
                            disabled={loadingCommunities}
                        >
                            <option value="">{loadingCommunities ? 'Loading...' : 'Select a community'}</option>
                            {communities.map(community => (
                                <option key={community.communityId} value={community.communityId}>
                                    {community.communityName}
                                </option>
                            ))}
                        </select>
                        <Link
                            to="/admin/add-community"
                            state={{ from: location.pathname, customerData: customerData }}
                            className="add-new-link"
                        >
                            Add New
                        </Link>
                    </div>
                </div>
                <button type="submit" className="submit-button" disabled={loadingCommunities}>Add Customer</button>
                {success && <p className="success-message">{success}</p>}
                {error && <p className="error-message">{error}</p>}
            </form>
        </div>
    );
};

export default AddCustomerPage;

