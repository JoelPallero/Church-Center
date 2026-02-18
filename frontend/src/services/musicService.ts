import api from './api';
import type { Instrument } from '../types/domain';

export const musicService = {
    getAllInstruments: async (): Promise<Instrument[]> => {
        try {
            const response = await api.get('/music.php?action=instruments');
            return response.data.instruments || [];
        } catch (error) {
            console.error('Failed to fetch instruments', error);
            return [];
        }
    },

    updateUserInstruments: async (instrumentIds: number[]): Promise<boolean> => {
        try {
            const response = await api.post('/music.php?action=update_my_instruments', { instrumentIds });
            return response.data.success;
        } catch (error) {
            console.error('Failed to update instruments', error);
            return false;
        }
    }
};
