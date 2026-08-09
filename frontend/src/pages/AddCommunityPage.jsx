import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import apiClient from '../services/api';
import { CommunitySummaryView } from '../components/SummaryViews';
import './AdminForms.css';
import './BookActions.css';

const AddCommunityPage = () => {
    const [currentAction, setCurrentAction] = useState('add');
    const [communityData, setCommunityData] = useState({
        communityName: '',
        description: '',
    });
    const [communities, setCommunities] = useState([]);
    const [selectedCommunityId, setSelectedCommunityId] = useState('');
    const [communitySummary, setCommunitySummary] = useState(null);
    const [loadingCommunities, setLoadingCommunities] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const fetchCommunities = async () => {
        try {
            setLoadingCommunities(true);
            const response = await apiClient.get('/communities');
            setCommunities(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Error loading communities:', err);
            setError(err.response?.data?.message || 'Failed to load communities.');
        } finally {
            setLoadingCommunities(false);
        }
    };

    const loadCommunitySummary = async (communityId) => {
        if (!communityId) return;
        try {
            setLoadingSummary(true);
            setError(null);
            const response = await apiClient.get(`/communities/${communityId}/summary`);
            setCommunitySummary(response.data);
            setSelectedCommunityId(String(response.data.communityId));
        } catch (err) {
            console.error('Error loading community summary:', err);
            setCommunitySummary(null);
            setError(err.response?.data?.message || 'Failed to load community summary.');
        } finally {
            setLoadingSummary(false);
        }
    };

    useEffect(() => {
        fetchCommunities();
    }, []);

    useEffect(() => {
        if (location.state?.communityAction === 'view' && location.state?.communityId) {
            setCurrentAction('view');
            loadCommunitySummary(location.state.communityId);
        }
    }, [location.state]);

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
            setSuccess('Community added successfully.');
            setCommunityData({ communityName: '', description: '' });
            await fetchCommunities();
             // If we were sent here from another page, navigate back to it immediately.
             if (location.state?.from) {
                navigate(location.state.from, {
                    state: {
                        customerData: location.state.customerData, // Pass the original customer data back
                        newCommunityId: response.data.communityId, // Pass the new community's ID
                    }
                });
            } else {
                setCurrentAction('view');
                loadCommunitySummary(response.data.communityId);
            }
        } catch (err) {
            console.error("Error adding community:", err);
            setError(err.response?.data?.message || "Failed to add community. Please check the details.");
        }
    };

    const handleActionChange = (action) => {
        setCurrentAction(action);
        setError(null);
        setSuccess(null);
        if (action === 'add') {
            setCommunitySummary(null);
            setSelectedCommunityId('');
        }
    };

    const handleCommunitySelect = (event) => {
        const communityId = event.target.value;
        setSelectedCommunityId(communityId);
        setCommunitySummary(null);
        if (communityId) {
            loadCommunitySummary(communityId);
        }
    };

    return (
        <div className={`admin-form-container ${currentAction === 'view' ? 'summary-container' : ''}`}>
            <div className="action-tabs">
                <button type="button" onClick={() => handleActionChange('add')} className={currentAction === 'add' ? 'active' : ''}>Add Community</button>
                <button type="button" onClick={() => handleActionChange('view')} className={currentAction === 'view' ? 'active' : ''}>View Community</button>
            </div>
            <Link to="/" className="back-link">&larr; Back to Dashboard</Link>
            {currentAction === 'add' && (
                <>
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
                    </form>
                </>
            )}

            {currentAction === 'view' && (
                <>
                    <h1>View Community</h1>
                    <div className="admin-form">
                        <div className="form-group">
                            <label htmlFor="communitySelect">Select Community</label>
                            <select id="communitySelect" value={selectedCommunityId} onChange={handleCommunitySelect} disabled={loadingCommunities}>
                                <option value="">{loadingCommunities ? 'Loading...' : 'Select a community'}</option>
                                {communities.map(community => (
                                    <option key={community.communityId} value={community.communityId}>
                                        {community.communityName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {loadingSummary && <p>Loading community summary...</p>}
                    {!loadingSummary && communitySummary && <CommunitySummaryView summary={communitySummary} />}
                </>
            )}
            {success && <p className="success-message">{success}</p>}
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default AddCommunityPage;
