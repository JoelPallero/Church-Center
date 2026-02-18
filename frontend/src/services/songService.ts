import api from './api';
import type { Song, SongEdit } from '../types/domain';

export type { Song };


export const songService = {

    getAll: async (): Promise<Song[]> => {
        try {
            const response = await api.get('/songs.php');
            return (response.data && Array.isArray(response.data)) ? response.data.map((s: any) => ({
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

    getById: async (id: string | number): Promise<Song | undefined> => {
        try {
            const response = await api.get(`/songs.php?id=${id}`);
            const s = response.data;
            if (s) {
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

    add: async (song: Omit<Song, 'id' | 'churchId'>): Promise<Song> => {
        const response = await api.post('/songs.php', {
            title: song.title,
            artist: song.artist,
            original_key: song.originalKey,
            tempo: song.tempo,
            content: song.content,
            category: song.category
        });

        return {
            ...song,
            id: response.data.id,
            churchId: response.data.churchId || 0
        } as Song;
    },

    update: async (id: number | string, song: Partial<Song>): Promise<boolean> => {
        try {
            await api.put(`/songs.php?id=${id}`, {
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
            await api.post('/song_edits.php?action=submit', {
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
            const response = await api.get('/song_edits.php?action=list_pending');
            return response.data || [];
        } catch (error) {
            console.error('Failed to fetch pending edits', error);
            return [];
        }
    },

    approveEdit: async (editId: number): Promise<boolean> => {
        try {
            await api.post('/song_edits.php?action=approve', { id: editId });
            return true;
        } catch (error) {
            console.error('Failed to approve edit', error);
            return false;
        }
    },

    rejectEdit: async (editId: number, notes: string): Promise<boolean> => {
        try {
            await api.post('/song_edits.php?action=reject', { id: editId, notes });
            return true;
        } catch (error) {
            console.error('Failed to reject edit', error);
            return false;
        }
    },

    delete: async (id: number | string): Promise<boolean> => {
        try {
            await api.delete(`/songs.php?id=${id}`);
            return true;
        } catch (error) {
            console.error('Failed to delete song', error); // Changed error message for clarity
            return false;
        }
    }
};
