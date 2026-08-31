import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminForms.css';
import './LoginPage.css';

const LoginPage = () => {
    const { userRole, loginAsGuest, loginAsAdmin } = useAuth();
    const navigate = useNavigate();
    const [showAdminForm, setShowAdminForm] = useState(false);
    const [credentials, setCredentials] = useState({
        username: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (userRole === 'admin') {
            navigate('/', { replace: true });
        }
    }, [navigate, userRole]);

    const handleGuestLogin = () => {
        loginAsGuest();
        navigate('/browse');
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const getLoginError = (err) => {
        const data = err.response?.data;
        if (typeof data === 'string' && data.trim()) {
            return data;
        }

        return data?.message || data?.error || err.message || 'Invalid username or password.';
    };

    const handleAdminLogin = async (event) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await loginAsAdmin(credentials);
            navigate('/');
        } catch (err) {
            setError(getLoginError(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page page-container">
            <section className="admin-form-container login-panel">
                <h1>Login</h1>

                <div className="login-actions">
                    <button type="button" className="login-choice guest" onClick={handleGuestLogin}>
                        Login as Guest
                    </button>
                    <button
                        type="button"
                        className={`login-choice admin ${showAdminForm ? 'selected' : ''}`}
                        onClick={() => setShowAdminForm(true)}
                    >
                        Login as Admin
                    </button>
                </div>

                {showAdminForm && (
                    <form className="admin-form login-form" onSubmit={handleAdminLogin}>
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={credentials.username}
                                onChange={handleChange}
                                autoComplete="username"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={credentials.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                required
                            />
                        </div>
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? 'Checking...' : 'Enter Admin'}
                        </button>
                    </form>
                )}

                {error && <p className="error-message">{error}</p>}
            </section>
        </div>
    );
};

export default LoginPage;
