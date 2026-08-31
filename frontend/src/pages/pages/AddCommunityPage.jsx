import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import apiClient from '../services/api';
import { CommunitySummaryView } from '../components/SummaryViews';
import './AdminForms.css';
import './BookActions.css';

const getEmptyCommunity = () => ({
    communityName: '',
    description: '',
});

const AddCommunityPage = () => {
    const [currentAction, setCurrentAction] = useState('add');
    const [communityData, setCommunityData] = useState(getEmptyCommunity());
    const [communities, setCommunities] = useState([]);
    const [selectedCommunityId, setSelectedCommunityId] = useState('');
    const [communitySummary, setCommunitySummary] = useState(null);
    const [loadingCommunities, setLoadingCommunities] = useState(false);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [isAddingCommunity, setIsAddingCommunity] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const addCommunityRequestInFlight = useRef(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleViewBack = () => {
        if (window.history.length > 1 && location.key !== 'default') {
            navigate(-1);
            return;
        }

        navigate('/admin/add-community');
    };

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
        if (addCommunityRequestInFlight.current) {
            return;
        }

        setError(null);
        setSuccess(null);
        addCommunityRequestInFlight.current = true;
        setIsAddingCommunity(true);

        try {
         // We need the response to get the ID of the new community
            const response = await apiClient.post('/communities', communityData);
            setSuccess('Community added successfully.');
            setCommunityData(getEmptyCommunity());
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
                setCurrentAction('add');
                setSelectedCommunityId('');
                setCommunitySummary(null);
            }
        } catch (err) {
            console.error("Error adding community:", err);
            setError(err.response?.data?.message || "Failed to add community. Please check the details.");
        } finally {
            addCommunityRequestInFlight.current = false;
            setIsAddingCommunity(false);
        }
    };

    const handleActionChange = (action) => {
        setCurrentAction(action);
        setError(null);
        setSuccess(null);
        if (action === 'add') {
            setCommunitySummary(null);
            setSelectedCommunityId('');
            setCommunityData(getEmptyCommunity());
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
                        <button type="submit" className="submit-button" disabled={isAddingCommunity}>
                            {isAddingCommunity ? 'Adding Community...' : 'Add Community'}
                        </button>
                    </form>
                </>
            )}

            {currentAction === 'view' && (
                <>
                    <h1>View Community</h1>
                    <button type="button" className="history-back-button" onClick={handleViewBack}>Back</button>
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
