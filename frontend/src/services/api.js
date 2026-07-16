import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Create an axios instance with a predefined base URL.
// This avoids repeating the URL in every component.
const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

export default apiClient;

