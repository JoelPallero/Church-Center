import api from './api';
import type { User } from '../types/domain';

export const AuthService = {
    login: async (email: string, password: string) => {
        const response = await api.post('/auth.php?action=login', { email, password });
        if (response.data.success) {
            localStorage.setItem('auth_token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    register: async (name: string, email: string) => {
        const response = await api.post('/auth.php?action=register', { name, email });
        if (response.data.success) {
            localStorage.setItem('auth_token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    getCurrentUser: async (): Promise<User | null> => {
        const data = await AuthService.me();
        return data.success ? data.user : null;
    },

    me: async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return { success: false };

            const response = await api.get('/auth.php?action=me');
            return response.data;
        } catch (error) {
            console.error('Auth Check Failed', error);
            return { success: false };
        }
    },

    updateSettings: async (theme: string, language: string) => {
        try {
            const response = await api.post('/auth.php?action=update_settings', {
                default_theme: theme,
                default_language: language
            });
            if (response.data.success) {
                // Update local user data too
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    user.default_theme = theme;
                    user.default_language = language;
                    localStorage.setItem('user', JSON.stringify(user));
                }
            }
            return response.data;
        } catch (error) {
            console.error('Failed to update settings in DB', error);
            return { success: false };
        }
    }
};
