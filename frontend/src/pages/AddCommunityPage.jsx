import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import apiClient from '../services/api';
import './AdminForms.css';

const AddCommunityPage = () => {
    const [communityData, setCommunityData] = useState({
        communityName: '',
        description: '',
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();


    const handleChange = (e) => {
        const { name, value } = e.target;
        setCommunityData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
         // We need the response to get the ID of the new community
            const response = await apiClient.post('/communities', communityData);
            setSuccess('Community added successfully! Redirecting...');
             // If we were sent here from another page, navigate back to it immediately.
             if (location.state?.from) {
                navigate(location.state.from, {
                    state: {
                        customerData: location.state.customerData, // Pass the original customer data back
                        newCommunityId: response.data.communityId, // Pass the new community's ID
                    }
                });
            } else {
                // Otherwise, wait 2 seconds and go to the main community page.
                setTimeout(() => navigate('/community'), 2000);
            }
        } catch (err) {
            console.error("Error adding community:", err);
            setError(err.response?.data?.message || "Failed to add community. Please check the details.");
        }
    };

    return (
        <div className="admin-form-container">
            <Link to="/" className="back-link">&larr; Back to Dashboard</Link>
            <h1>Add a New Community</h1>
            <form onSubmit={handleSubmit} className="admin-form">
                <div className="form-group">
                    <label htmlFor="communityName">Community Name</label>
                    <input
                        type="text"
                        id="communityName"
                        name="communityName"
                        value={communityData.communityName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description (Optional)</label>
                    <textarea
                        id="description"
                        name="description"
                        value={communityData.description}
                        onChange={handleChange}
                        rows="4"
                    />
                </div>
                <button type="submit" className="submit-button">Add Community</button>
                {success && <p className="success-message">{success}</p>}
                {error && <p className="error-message">{error}</p>}
            </form>
        </div>
    );
};

export default AddCommunityPage;
