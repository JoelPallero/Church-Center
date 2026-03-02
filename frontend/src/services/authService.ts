import api from './api';
import type { Church } from '../types/domain';

export interface BootstrapData {
    user: any; // Raw backend user
    is_superadmin: boolean;
    church: Church | null;
    permissions: string[];
    services: string[];
    roles: string[];
    features: Record<string, boolean>;
}

export const AuthService = {
    async login(email: string, password: string, recaptchaToken?: string): Promise<{ success: boolean; access_token: string; expires_in: number; error?: string }> {
        const response = await api.post('/auth/login', { email, password, recaptchaToken });
        if (response.data.success && response.data.access_token) {
            localStorage.setItem('auth_token', response.data.access_token);
        }
        return response.data;
    },

    async getBootstrap(): Promise<{ success: boolean; data: BootstrapData; error?: string }> {
        const response = await api.get('/bootstrap');
        return response.data;
    },

    async register(name: string, email: string): Promise<any> {
        const response = await api.post('/auth/register', { name, email });
        return response.data;
    },

    async updateSettings(theme: string, language: string): Promise<any> {
        const response = await api.post('/auth/update_settings', { theme, language });
        return response.data;
    },

    logout() {
        localStorage.removeItem('auth_token');
    }
};

export default AuthService;
