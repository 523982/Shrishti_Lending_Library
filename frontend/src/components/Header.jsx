import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
    const { userRole, username, logout } = useAuth();

    return (
        <header className="app-header">
            <div className="logo">
                <Link to="/">Shrishti Lending Library</Link>
            </div>
            <div className="header-right">
                <nav>
                    <NavLink to="/browse">Browse Books</NavLink>
                    {userRole === 'admin' && (
                        <>
                            <NavLink to="/admin/books">Manage Books</NavLink>
                            <NavLink to="/admin/customers">Manage Customers</NavLink>
                            <NavLink to="/admin/add-community">Add Community</NavLink>
                            <NavLink to="/admin/reports">Reports</NavLink>
                        </>
                    )}
                </nav>
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
            </div>
        </header>
    );
};

export default Header;

