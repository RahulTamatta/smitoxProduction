import axios from 'axios';

/**
 * Centralized axios instance with interceptors
 * Base API configuration for all HTTP requests
 */
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '/api/v1',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
    (config) => {
        const auth = localStorage.getItem('auth');
        if (auth) {
            try {
                const authData = JSON.parse(auth);
                if (authData?.token) {
                    config.headers.Authorization = `Bearer ${authData.token}`;
                }
            } catch (error) {
                console.error('Error parsing auth token:', error);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle network errors
        if (!error.response) {
            console.error('Network error:', error.message);
            return Promise.reject({
                message: 'Network error. Please check your connection.',
                isNetworkError: true,
            });
        }

        // Handle 401 Unauthorized
        if (error.response.status === 401) {
            localStorage.removeItem('auth');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api;
