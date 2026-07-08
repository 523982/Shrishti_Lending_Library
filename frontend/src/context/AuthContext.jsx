import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Default to 'guest'. Can be 'guest' or 'admin'.
    const [userRole, setUserRole] = useState('guest');

    const loginAsAdmin = () => setUserRole('admin');
    const logout = () => setUserRole('guest');

    const value = { userRole, loginAsAdmin, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};

