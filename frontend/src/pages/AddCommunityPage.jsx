import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import apiClient from '../services/api';
import { CommunitySummaryView } from '../components/SummaryViews';
import ManagementActionMenu from '../components/ManagementActionMenu';
import './AdminForms.css';
import './BookActions.css';

const getEmptyCommunity = () => ({
    communityName: '',
    description: '',
});

const communityActionItems = [
    { key: 'add', label: 'Add Community' },
    { key: 'view', label: 'View Community' },
    { key: 'all', label: 'All Communities' },
];

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
        const returnTo = location.state?.returnTo;
        if (returnTo?.pathname) {
            navigate(returnTo.pathname, { state: returnTo.state || {} });
            return;
        }

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
        if (location.state?.communityAction === 'all') {
            setCurrentAction('all');
            return;
        }
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
        <div className={`admin-form-container ${['view', 'all'].includes(currentAction) ? 'summary-container' : ''}`}>
            <ManagementActionMenu
                title="Community Management"
                actions={communityActionItems}
                currentAction={currentAction}
                onActionChange={handleActionChange}
            />
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
            {currentAction === 'all' && (
                <>
                    <h1>All Communities</h1>
                    {loadingCommunities && <p>Loading communities...</p>}
                    {!loadingCommunities && (
                        <div className="management-list-panel">
                            {communities.length === 0 ? (
                                <p>No communities found.</p>
                            ) : (
                                <div className="payment-table-wrap">
                                    <table className="payment-table">
                                        <thead>
                                            <tr>
                                                <th>Community</th>
                                                <th>Active Offer</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {communities.map(community => (
                                                <tr key={community.communityId}>
                                                    <td data-label="Community">{community.communityName || '-'}</td>
                                                    <td data-label="Active Offer">{community.offerActive ? 'Active' : 'No active offer'}</td>
                                                    <td data-label="Action">
                                                        <button
                                                            type="button"
                                                            className="inline-link-button"
                                                            onClick={() => {
                                                                setCurrentAction('view');
                                                                loadCommunitySummary(community.communityId);
                                                            }}
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
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

export default AddCommunityPage;
