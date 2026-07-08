import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
    const { userRole, loginAsAdmin, logout } = useAuth();

    return (
        <header className="app-header">
            <div className="logo">
                <Link to="/">Shrishti Lending Library</Link>
            </div>
            <div className="header-right">
                <nav>
                    <NavLink to="/browse">Browse Books</NavLink>
                    <NavLink to="/community">Community</NavLink>
                </nav>
                <div className="auth-section">
                    {userRole === 'admin' ? (
                        <button onClick={logout} className="auth-button">Logout</button>
                    ) : (
                        <button onClick={loginAsAdmin} className="auth-button">Login as Admin</button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;

