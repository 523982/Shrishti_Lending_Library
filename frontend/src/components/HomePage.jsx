import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/AdminDashboard';
import UserHomePage from '../components/UserHomePage';

const HomePage = () => {
    const { userRole } = useAuth();


    // Render the appropriate component based on the user's role
    return (
        userRole === 'admin' ? <AdminDashboard /> : <UserHomePage />
    );
};
export default HomePage;

