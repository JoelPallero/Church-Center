import api from './api';

export const reportService = {
    getDashboardStats: async () => {
        try {
            const response = await api.get('/reports.php');
            return response.data.success ? response.data.data : null;
        } catch (error) {
            console.error('Failed to fetch report stats', error);
            return null;
        }
    }
};
