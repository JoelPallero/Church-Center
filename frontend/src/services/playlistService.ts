import api from './api';
import type { Playlist } from '../types/domain';

export const playlistService = {
    getAll: async (churchId?: number, groupId?: number): Promise<Playlist[]> => {
        try {
            let url = `/playlists?churchId=${churchId || ''}`;
            if (groupId) url += `&groupId=${groupId}`;
            const response = await api.get(url);
            return response.data.playlists || [];
        } catch (error) {
            console.error('Failed to fetch playlists', error);
            return [];
        }
    },

    getById: async (id: number, churchId?: number): Promise<Playlist | null> => {
        try {
            const response = await api.get(`/playlists/${id}${churchId ? `?churchId=${churchId}` : ''}`);
            return response.data.playlist || response.data.songs || null;
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
    },
    addSong: async (playlistId: number, songId: number, order?: number): Promise<boolean> => {
        try {
            const response = await api.post('/playlists/add-song', { playlistId, songId, order });
            return response.data.success;
        } catch (error) {
            console.error('Failed to add song to playlist', error);
            return false;
        }
    },
    removeSong: async (playlistId: number, songId: number): Promise<boolean> => {
        try {
            const response = await api.post('/playlists/remove-song', { playlistId, songId });
            return response.data.success;
        } catch (error) {
            console.error('Failed to remove song from playlist', error);
            return false;
        }
    },
    duplicate: async (playlistId: number, name: string, meetingId?: number, songs?: number[]): Promise<any> => {
        try {
            const response = await api.post('/playlists/duplicate', { playlistId, name, meetingId, songs });
            return response.data;
        } catch (error) {
            console.error('Failed to duplicate playlist', error);
            return { success: false };
        }
    }
};
