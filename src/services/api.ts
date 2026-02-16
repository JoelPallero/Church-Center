import axios from 'axios';

// Detect if we are in development or production
const BASE_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api');

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Inject Token
api.interceptors.request.use(
    (config: any) => {
        // Retrieve token from storage
        const token = localStorage.getItem('auth_token');

        // For Dev Bypass, if no token exists, we can inject a dummy one if we want implicit auth
        // But better to rely on what is stored.
        // If the backend is exclusively in bypass mode, the token value might not matter,
        // but sending one is good practice.
        const effectiveToken = token || 'BYPASS_TOKEN_DEV_MODE';

        if (effectiveToken) {
            config.headers.Authorization = `Bearer ${effectiveToken}`;
        }
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401/403
api.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
        if (error.response?.status === 401) {
            // Unauthenticated
            console.warn('Unauthorized access. Redirect to login?');
            // localStorage.removeItem('auth_token');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
