import api from './api';
import type { Instrument } from '../types/domain';

export const musicService = {
    getAllInstruments: async (): Promise<Instrument[]> => {
        try {
            const response = await api.get('/instruments');
            return response.data.instruments || [];
        } catch (error) {
            console.error('Failed to fetch instruments', error);
            return [];
        }
    },

    updateUserInstruments: async (instrumentIds: number[]): Promise<boolean> => {
        try {
            const response = await api.post('/instruments/mine', { instrumentIds });
            return response.data.success;
        } catch (error) {
            console.error('Failed to update instruments', error);
            return false;
        }
    }
};
