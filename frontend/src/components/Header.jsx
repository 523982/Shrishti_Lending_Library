import React, { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
    const { userRole, username, logout } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!isSidebarOpen) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsSidebarOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSidebarOpen]);

    const navLinks = [
        { to: '/', label: 'Home' },
        { to: '/browse', label: 'Browse Books' },
    ];

    if (userRole === 'admin') {
        navLinks.push(
            { to: '/admin/books', label: 'Manage Books' },
            { to: '/admin/customers', label: 'Manage Customers' },
            { to: '/admin/offers', label: 'Manage Offers' },
            { to: '/admin/add-community', label: 'Manage Communities' },
            { to: '/admin/reports', label: 'Reports' },
        );
    }

    return (
        <>
            <header className="app-header">
                <button
                    type="button"
                    className={`sidebar-toggle ${isSidebarOpen ? 'open' : ''}`}
                    aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    aria-expanded={isSidebarOpen}
                    aria-controls="app-sidebar"
                    onClick={() => setIsSidebarOpen((open) => !open)}
                >
                    <span className="sidebar-toggle-icon" aria-hidden="true" />
                </button>

                <div className="logo">
                    <Link to="/">Shrishti Lending Library</Link>
                </div>

                <div className="auth-section">
                    {userRole === 'admin' ? (
                        <>
                            <span className="admin-user">{username ? `Admin: ${username}` : 'Admin'}</span>
                            <button onClick={logout} className="auth-button">Logout</button>
                        </>
                    ) : (
                        <Link to="/login" className="auth-button">Login</Link>
                    )}
                </div>
            </header>

            <button
                type="button"
                className={`sidebar-backdrop ${isSidebarOpen ? 'open' : ''}`}
                aria-label="Close navigation menu"
                onClick={() => setIsSidebarOpen(false)}
            />

            <aside id="app-sidebar" className={`app-sidebar ${isSidebarOpen ? 'open' : ''}`} aria-hidden={!isSidebarOpen}>
                <div className="sidebar-header">
                    <div>
                        <span className="sidebar-eyebrow">Menu</span>
                        <h2>Shrishti Library</h2>
                    </div>
                    <button type="button" className="sidebar-close" aria-label="Close navigation menu" onClick={() => setIsSidebarOpen(false)}>
                        <span className="sidebar-close-icon" aria-hidden="true" />
                    </button>
                </div>

                <nav className="sidebar-nav" aria-label="Main navigation">
                    {navLinks.map((link) => (
                        <NavLink key={link.to} to={link.to} end={link.to === '/'}>
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
};

export default Header;

