import api from './api';

export const reportService = {
    getDashboardStats: async (churchId?: number) => {
        try {
            const response = await api.get(`/reports${churchId ? `?church_id=${churchId}` : ''}`);
            return response.data.success ? response.data.data : null;
        } catch (error) {
            console.error('Failed to fetch report stats', error);
            return null;
        }
    }
};
