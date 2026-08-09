import React, { useMemo, useState, useEffect } from 'react';
import apiClient from '../services/api'; // Import our new API client

const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const describeOffer = (offer) => {
    if (!offer) return 'No active offer';
    if (offer.offerType === 'BUNDLE') {
        return `${offer.bundleBookCount || 0} books for ${currency.format(Number(offer.bundlePrice) || 0)}`;
    }
    return `${Number(offer.discountPercent) || 0}% off`;
};

const Community = () => {
    const [communities, setCommunities] = useState([]);
    const [offers, setOffers] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true); // Add a loading state

    const offersById = useMemo(
        () => Object.fromEntries(offers.map(offer => [String(offer.offerId), offer])),
        [offers]
    );

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                // Use the apiClient to make the request. We only need the endpoint path.
                const [communitiesResponse, offersResponse] = await Promise.all([
                    apiClient.get('/communities'),
                    apiClient.get('/offers'),
                ]);
                setCommunities(Array.isArray(communitiesResponse.data) ? communitiesResponse.data : []);
                setOffers(Array.isArray(offersResponse.data) ? offersResponse.data : []);
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
                                        {communities.map(community => {
                                            const activeOffer = community.offerActive && community.activeOfferId
                                                ? offersById[String(community.activeOfferId)]
                                                : null;

                                            return (
                                                <li key={community.communityId}>
                                                    <strong>{community.communityName}</strong>
                                                    <span> - {describeOffer(activeOffer)}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : <p>No communities found.</p>
            )}
        </div>
    );
};

export default Community;
