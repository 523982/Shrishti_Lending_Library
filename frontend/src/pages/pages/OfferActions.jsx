import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import './AdminForms.css';
import './OfferActions.css';

const todayInput = () => new Date().toISOString().split('T')[0];

const emptyOffer = {
    offerName: '',
    communityId: '',
    offerType: 'BUNDLE',
    startDate: todayInput(),
    endDate: todayInput(),
    discountPercent: '',
    bundleBookCount: 4,
    bundlePrice: 100,
    bundleDurationDays: 60,
    active: true,
};

const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const describeOffer = (offer) => {
    if (!offer) return 'No active offer';
    if (offer.offerType === 'BUNDLE') {
        return `${offer.bundleBookCount || 0} books for ${currency.format(Number(offer.bundlePrice) || 0)} in ${offer.bundleDurationDays || 0} days`;
    }
    return `${Number(offer.discountPercent) || 0}% off`;
};

const getApiErrorMessage = (err, fallback) => {
    const data = err.response?.data;
    if (typeof data === 'string' && data.trim()) {
        return data;
    }
    return data?.message || data?.error || fallback;
};

const OfferActionsPage = () => {
    const [offers, setOffers] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [formData, setFormData] = useState(emptyOffer);
    const [editingOfferId, setEditingOfferId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const communityById = useMemo(
        () => Object.fromEntries(communities.map(community => [String(community.communityId), community])),
        [communities]
    );

    const loadData = async () => {
        try {
            setLoading(true);
            const [offersResponse, communitiesResponse] = await Promise.all([
                apiClient.get('/offers'),
                apiClient.get('/communities'),
            ]);
            setOffers(Array.isArray(offersResponse.data) ? offersResponse.data : []);
            setCommunities(Array.isArray(communitiesResponse.data) ? communitiesResponse.data : []);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to load offers.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const buildPayload = () => ({
        offerName: formData.offerName.trim(),
        communityId: Number(formData.communityId),
        offerType: formData.offerType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        discountPercent: formData.offerType === 'PERCENT' ? Number(formData.discountPercent) : null,
        bundleBookCount: formData.offerType === 'BUNDLE' ? Number(formData.bundleBookCount) : null,
        bundlePrice: formData.offerType === 'BUNDLE' ? Number(formData.bundlePrice) : null,
        bundleDurationDays: formData.offerType === 'BUNDLE' ? Number(formData.bundleDurationDays) : null,
        active: formData.active,
    });

    const resetForm = () => {
        setFormData(emptyOffer);
        setEditingOfferId(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            if (editingOfferId) {
                await apiClient.put(`/offers/${editingOfferId}`, buildPayload());
                setSuccess('Offer updated successfully.');
            } else {
                await apiClient.post('/offers', buildPayload());
                setSuccess('Offer created successfully.');
            }
            resetForm();
            await loadData();
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to save offer.'));
        }
    };

    const handleEdit = (offer) => {
        setEditingOfferId(offer.offerId);
        setFormData({
            offerName: offer.offerName || '',
            communityId: offer.communityId || '',
            offerType: offer.offerType || 'BUNDLE',
            startDate: offer.startDate || todayInput(),
            endDate: offer.endDate || todayInput(),
            discountPercent: offer.discountPercent || '',
            bundleBookCount: offer.bundleBookCount || 4,
            bundlePrice: offer.bundlePrice || 100,
            bundleDurationDays: offer.bundleDurationDays || 60,
            active: Boolean(offer.active),
        });
        setSuccess(null);
        setError(null);
    };

    const handleToggleActive = async (offer) => {
        setError(null);
        setSuccess(null);
        try {
            const action = offer.active ? 'deactivate' : 'activate';
            await apiClient.put(`/offers/${offer.offerId}/${action}`);
            setSuccess(offer.active ? 'Offer deactivated.' : 'Offer activated.');
            await loadData();
        } catch (err) {
            setError(getApiErrorMessage(err, 'Failed to change offer status.'));
        }
    };

    return (
        <div className="offers-page">
            <Link to="/" className="back-link">&larr; Back to Dashboard</Link>
            <div className="offers-layout">
                <section className="admin-form-container offer-form-panel">
                    <h1>{editingOfferId ? 'Modify Offer' : 'Create Offer'}</h1>
                    <form className="admin-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="offerName">Offer Name</label>
                            <input id="offerName" name="offerName" type="text" value={formData.offerName} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="communityId">Community</label>
                            <select id="communityId" name="communityId" value={formData.communityId} onChange={handleChange} required>
                                <option value="">Select Community</option>
                                {communities.map(community => (
                                    <option key={community.communityId} value={community.communityId}>
                                        {community.communityName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="offerType">Offer Type</label>
                            <select id="offerType" name="offerType" value={formData.offerType} onChange={handleChange}>
                                <option value="BUNDLE">Bundle / Subscription</option>
                                <option value="PERCENT">Percentage Discount</option>
                            </select>
                        </div>
                        <div className="date-grid">
                            <div className="form-group">
                                <label htmlFor="startDate">Start Date</label>
                                <input id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="endDate">End Date</label>
                                <input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleChange} required />
                            </div>
                        </div>
                        {formData.offerType === 'PERCENT' ? (
                            <div className="form-group">
                                <label htmlFor="discountPercent">Discount Percent</label>
                                <input id="discountPercent" name="discountPercent" type="number" min="0" max="100" value={formData.discountPercent} onChange={handleChange} required />
                            </div>
                        ) : (
                            <>
                                <div className="form-group">
                                    <label htmlFor="bundleBookCount">Books Allowed</label>
                                    <input id="bundleBookCount" name="bundleBookCount" type="number" min="1" value={formData.bundleBookCount} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="bundlePrice">Bundle Price (Rs.)</label>
                                    <input id="bundlePrice" name="bundlePrice" type="number" min="1" value={formData.bundlePrice} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="bundleDurationDays">Subscription Duration (Days)</label>
                                    <input id="bundleDurationDays" name="bundleDurationDays" type="number" min="1" value={formData.bundleDurationDays} onChange={handleChange} required />
                                </div>
                            </>
                        )}
                        <div className="form-group form-group-inline">
                            <input id="active" name="active" type="checkbox" checked={formData.active} onChange={handleChange} />
                            <label htmlFor="active">Set as active offer</label>
                        </div>
                        <button type="submit" className="submit-button">{editingOfferId ? 'Update Offer' : 'Create Offer'}</button>
                        {editingOfferId && (
                            <button type="button" className="secondary-button" onClick={resetForm}>Cancel Edit</button>
                        )}
                    </form>
                    {success && <p className="success-message">{success}</p>}
                    {error && <p className="error-message">{error}</p>}
                </section>

                <section className="offers-list-panel">
                    <h2>Existing Offers</h2>
                    {loading ? (
                        <p>Loading offers...</p>
                    ) : offers.length === 0 ? (
                        <p>No offers created yet.</p>
                    ) : (
                        <div className="offers-list">
                            {offers.map(offer => (
                                <article key={offer.offerId} className="offer-row">
                                    <div>
                                        <h3>{offer.offerName}</h3>
                                        <p>{communityById[String(offer.communityId)]?.communityName || offer.communityName}</p>
                                        <p>{describeOffer(offer)}</p>
                                        <span className={offer.active ? 'offer-status active' : 'offer-status inactive'}>
                                            {offer.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="offer-row-actions">
                                        <button type="button" onClick={() => handleEdit(offer)}>Edit</button>
                                        <button type="button" onClick={() => handleToggleActive(offer)}>
                                            {offer.active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default OfferActionsPage;
