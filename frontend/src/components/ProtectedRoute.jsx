import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { userRole } = useAuth();

    if (userRole !== 'admin') {
        return <Navigate to="/login" replace />;
    }

    // If user is an admin, render the child routes
    return <Outlet />;
};

export default ProtectedRoute;
