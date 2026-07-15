import React, { createContext, useContext, useState } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = 'shrishtiLibraryAuth';

const getStoredAuth = () => {
    try {
        const storedAuth = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
        if (storedAuth?.userRole === 'admin') {
            return {
                userRole: 'admin',
                username: storedAuth.username || null,
            };
        }
    } catch (err) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    return {
        userRole: 'guest',
        username: null,
    };
};

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState(getStoredAuth);

    const setAuth = (nextAuthState) => {
        setAuthState(nextAuthState);

        if (nextAuthState.userRole === 'admin') {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuthState));
            return;
        }

        localStorage.removeItem(AUTH_STORAGE_KEY);
    };

    const loginAsGuest = () => {
        setAuth({
            userRole: 'guest',
            username: null,
        });
    };

    const loginAsAdmin = async ({ username, password }) => {
        const response = await apiClient.post('/auth/login', { username, password });
        const role = response.data?.role?.toLowerCase();

        if (role !== 'admin') {
            throw new Error('Only admin users can access admin area.');
        }

        setAuth({
            userRole: 'admin',
            username: response.data?.username || username,
        });

        return response.data;
    };

    const logout = () => loginAsGuest();

    const value = {
        userRole: authState.userRole,
        username: authState.username,
        loginAsGuest,
        loginAsAdmin,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};

