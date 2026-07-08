import axios from 'axios';

// Create an axios instance with a predefined base URL.
// This avoids repeating the URL in every component.
const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api',
});

export default apiClient;

