import api from './api';
import type { Song, SongEdit } from '../types/domain';

export type { Song };


export const songService = {

    getAll: async (churchId?: number): Promise<Song[]> => {
        try {
            const response = await api.get(`/songs${churchId ? `?church_id=${churchId}` : ''}`);
            const songs = response.data?.songs || [];
            return Array.isArray(songs) ? songs.map((s: any) => ({
                id: s.id,
                churchId: s.church_id,
                title: s.title,
                artist: s.artist,
                originalKey: s.original_key,
                tempo: s.tempo,
                timeSignature: s.time_signature || '4/4',
                content: s.content,
                category: s.category,
                bpmType: s.bpm_type || 'fast',
                memberKeys: s.member_keys || []
            })) : [];
        } catch (error) {
            console.error('Failed to fetch songs from API', error);
            return [];
        }
    },

    getById: async (id: string | number, churchId?: number): Promise<Song | undefined> => {
        try {
            const response = await api.get(`/songs/${id}${churchId ? `?church_id=${churchId}` : ''}`);
            const s = response.data?.song || response.data; // Try both formats
            if (s && s.id) {
                return {
                    id: s.id,
                    churchId: s.church_id,
                    title: s.title,
                    artist: s.artist,
                    originalKey: s.original_key,
                    timeSignature: s.time_signature || '4/4',
                    tempo: s.tempo,
                    content: s.content,
                    category: s.category
                };
            }
            return undefined;
        } catch (error) {
            console.error(`Failed to fetch song ${id}`, error);
            return undefined;
        }
    },

    add: async (song: Omit<Song, 'id' | 'churchId'>, churchId?: number): Promise<Song> => {
        const response = await api.post(`/songs${churchId ? `?church_id=${churchId}` : ''}`, {
            title: song.title,
            artist: song.artist,
            original_key: song.originalKey,
            tempo: song.tempo,
            content: song.content,
            category: song.category
        });

        const data = response.data;
        return {
            ...song,
            id: data.id,
            churchId: data.church_id || churchId || 0
        } as Song;
    },

    update: async (id: number | string, song: Partial<Song>): Promise<boolean> => {
        try {
            await api.put(`/songs/${id}`, {
                title: song.title,
                artist: song.artist,
                original_key: song.originalKey,
                tempo: song.tempo,
                content: song.content,
                category: song.category
            });
            return true;
        } catch (error: any) {
            console.error('Failed to update song', error);
            throw error;
        }
    },

    // Approval Workflow Methods
    submitEdit: async (edit: Omit<SongEdit, 'id' | 'status' | 'createdAt'>): Promise<boolean> => {
        try {
            await api.post('/songs/edits/submit', {
                song_id: edit.songId,
                proposed_title: edit.proposedTitle,
                proposed_artist: edit.proposedArtist,
                proposed_content: edit.proposedContent,
                proposed_key: edit.proposedKey,
                proposed_tempo: edit.proposedTempo,
                proposed_time_signature: edit.proposedTimeSignature,
                proposed_bpm_type: edit.proposedBpmType
            });
            return true;
        } catch (error) {
            console.error('Failed to submit song edit', error);
            return false;
        }
    },

    getPendingEdits: async (): Promise<SongEdit[]> => {
        try {
            const response = await api.get('/songs/edits/pending');
            return response.data || [];
        } catch (error) {
            console.error('Failed to fetch pending edits', error);
            return [];
        }
    },

    approveEdit: async (editId: number): Promise<boolean> => {
        try {
            await api.post(`/songs/edits/${editId}/approve`);
            return true;
        } catch (error) {
            console.error('Failed to approve edit', error);
            return false;
        }
    },

    rejectEdit: async (editId: number, notes: string): Promise<boolean> => {
        try {
            await api.post(`/songs/edits/${editId}/reject`, { notes });
            return true;
        } catch (error) {
            console.error('Failed to reject edit', error);
            return false;
        }
    },

    delete: async (id: number | string, churchId?: number): Promise<boolean> => {
        try {
            await api.delete(`/songs/${id}${churchId ? `?church_id=${churchId}` : ''}`);
            return true;
        } catch (error) {
            console.error('Failed to delete song', error);
            return false;
        }
    }
};
