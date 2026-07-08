import React, { useState, useEffect } from 'react';
import apiClient from '../services/api'; // Import our new API client

const Community = () => {
    const [communities, setCommunities] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true); // Add a loading state

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                // Use the apiClient to make the request. We only need the endpoint path.
                const response = await apiClient.get('/communities');
                setCommunities(response.data);
            } catch (err) {
                console.error("Error fetching communities:", err);
                setError("Could not fetch communities. Is the backend running?");
            } finally {
                // This will run whether the request succeeds or fails.
                setLoading(false);
            }
        };

        fetchCommunities();
    }, []); // The empty array [] means this effect runs only once.

    return (
             <div className="page-container">
            <h2>Communities</h2>
            {loading && <div>Loading communities...</div>}
            {error && <div style={{ color: 'red' }}>Error: {error}</div>}
            {!loading && !error && (
                                communities.length > 0 ? (
                                    <ul>
                                        {communities.map(community => (
                                            <li key={community.communityId}>{community.communityName}</li>
                                        ))}
                                    </ul>
                                ) : <p>No communities found.</p>
            )}
        </div>
    );
};

export default Community;