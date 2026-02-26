import api from './api';
import type { Playlist } from '../types/domain';

const IS_DEV = import.meta.env.DEV;

const MOCK_PLAYLISTS: Playlist[] = [
    {
        id: 1,
        churchId: 1,
        meetingId: 1,
        name: 'Listado domingo 15/02/2026',
        status: 'pending',
        isSantaCena: true,
        items: [],
        createdAt: '2026-02-14T10:00:00Z'
    },
    {
        id: 2,
        churchId: 1,
        meetingId: 2,
        name: 'Listado miércoles 18/02/2026',
        status: 'completed',
        isSantaCena: false,
        items: [],
        createdAt: '2026-02-13T10:00:00Z'
    }
];

export const playlistService = {
    getAll: async (churchId?: number): Promise<Playlist[]> => {
        if (IS_DEV) return MOCK_PLAYLISTS;
        try {
            const response = await api.get(`/playlists${churchId ? `?churchId=${churchId}` : ''}`);
            return response.data.playlists || [];
        } catch (error) {
            console.error('Failed to fetch playlists', error);
            return [];
        }
    },

    getById: async (id: number, churchId?: number): Promise<Playlist | null> => {
        if (IS_DEV) return MOCK_PLAYLISTS.find(p => p.id === id) || null;
        try {
            const response = await api.get(`/playlists/${id}${churchId ? `?churchId=${churchId}` : ''}`);
            return response.data.playlist || null;
        } catch (error) {
            console.error('Failed to fetch playlist detail', error);
            return null;
        }
    },

    create: async (data: any): Promise<any> => {
        try {
            const response = await api.post('/playlists', data);
            return response.data;
        } catch (error) {
            console.error('Failed to create playlist', error);
            return { success: false };
        }
    },

    delete: async (id: number): Promise<boolean> => {
        try {
            const response = await api.delete(`/playlists/${id}`);
            return response.data.success;
        } catch (error) {
            console.error('Failed to delete playlist', error);
            return false;
        }
    }
};
