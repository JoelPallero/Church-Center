import api from './api';
import type { User } from '../types/domain';

export type UserStatus = 'active' | 'inactive' | 'pending';


export const peopleService = {
    getAll: async (churchId?: number): Promise<User[]> => {
        try {
            const url = churchId ? `/people?church_id=${churchId}` : '/people';
            const response = await api.get(url);
            return response.data.success ? response.data.users : [];
        } catch (error) {
            console.error('Failed to fetch people', error);
            return [];
        }
    },

    getTeam: async (): Promise<User[]> => {
        try {
            const response = await api.get('/people/team');
            if (response.data.success) {
                return response.data.users;
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch team members', error);
            return [];
        }
    },

    updateRole: async (userId: number, roleId: number): Promise<boolean> => {
        try {
            await api.put(`/people/${userId}/role`, { roleId });
            return true;
        } catch (error) {
            console.error('Failed to update role', error);
            return false;
        }
    },

    updateStatus: async (userId: number, statusId: number): Promise<boolean> => {
        try {
            await api.put(`/people/${userId}/status`, { statusId });
            return true;
        } catch (error) {
            console.error('Failed to update status', error);
            return false;
        }
    },

    deleteMember: async (memberId: number): Promise<boolean> => {
        try {
            await api.delete(`/people/${memberId}`);
            return true;
        } catch (error) {
            console.error('Failed to delete member', error);
            return false;
        }
    },

    invite: async (name: string, email: string, roleId: number, churchId?: number): Promise<boolean> => {
        try {
            await api.post('/people/invite', { name, email, roleId, churchId });
            return true;
        } catch (error) {
            console.error('Failed to invite person', error);
            return false;
        }
    },

    bulkInvite: async (emails: string[], churchId?: number): Promise<any> => {
        try {
            const response = await api.post('/people/invite/bulk', { emails, churchId });
            return response.data;
        } catch (error) {
            console.error('Failed bulk invite', error);
            return { success: 0, failed: emails.length, errors: ['Request failed'] };
        }
    },

    resendInvitation: async (email: string): Promise<boolean> => {
        try {
            await api.post('/people/invite/resend', { email });
            return true;
        } catch (error) {
            console.error('Failed to resend invitation', error);
            return false;
        }
    },

    deleteInvitation: async (email: string): Promise<boolean> => {
        try {
            await api.delete('/people/invite', { data: { email } });
            return true;
        } catch (error) {
            console.error('Failed to delete invitation', error);
            return false;
        }
    },

    getGroups: async (churchId?: number, areaId?: number): Promise<any[]> => {
        try {
            const response = await api.get('/teams', { params: { churchId, areaId } });
            return response.data.groups || [];
        } catch (error) {
            console.error('Failed to fetch groups', error);
            return [];
        }
    },

    getAreas: async (churchId?: number): Promise<any[]> => {
        try {
            const response = await api.get('/areas', { params: { churchId } });
            return response.data.areas || [];
        } catch (error) {
            console.error('Failed to fetch areas', error);
            return [];
        }
    },

    joinGroup: async (groupId: number): Promise<boolean> => {
        try {
            await api.post(`/teams/${groupId}/join`);
            return true;
        } catch (error) {
            console.error('Failed to join group', error);
            return false;
        }
    },

    saveInstruments: async (instruments: number[]): Promise<boolean> => {
        try {
            await api.post('/instruments/mine', { instruments });
            return true;
        } catch (error) {
            console.error('Failed to save instruments', error);
            return false;
        }
    },

    getInstruments: async (): Promise<any[]> => {
        try {
            const response = await api.get('/instruments');
            return response.data.instruments || [];
        } catch (error) {
            console.error('Failed to fetch instruments', error);
            return [];
        }
    },

    getRoles: async (): Promise<any[]> => {
        try {
            const response = await api.get('/roles');
            return response.data.roles || [];
        } catch (error) {
            console.error('Failed to fetch roles', error);
            return [];
        }
    },

    addGroup: async (name: string, leaderId: number | null = null, areaId: number | null = null, churchId?: number, description: string = '', isServiceTeam: boolean = true): Promise<any> => {
        try {
            const response = await api.post('/teams', { name, leaderId, areaId, churchId, description, isServiceTeam });
            return response.data;
        } catch (error) {
            console.error('Failed to add group', error);
            return null;
        }
    },

    addArea: async (name: string, churchId?: number): Promise<boolean> => {
        try {
            await api.post('/areas', { name, churchId });
            return true;
        } catch (error) {
            console.error('Failed to add area', error);
            return false;
        }
    },

    assignTeam: async (memberId: number, teamId: number, roleInGroup: string): Promise<boolean> => {
        try {
            await api.post(`/teams/${teamId}/members`, { memberId, roleInGroup });
            return true;
        } catch (error) {
            console.error('Failed to assign team', error);
            return false;
        }
    },

    deleteGroup: async (groupId: number, churchId?: number): Promise<boolean> => {
        try {
            await api.delete(`/teams/${groupId}`, { params: { churchId } });
            return true;
        } catch (error) {
            console.error('Failed to delete group', error);
            return false;
        }
    },

    assignTeamBulk: async (groupId: number, memberIds: number[]): Promise<boolean> => {
        try {
            await api.post(`/teams/${groupId}/members/bulk`, { memberIds });
            return true;
        } catch (error) {
            console.error('Failed bulk assignment', error);
            return false;
        }
    },

    getTeamMembers: async (groupId: number, churchId?: number): Promise<any[]> => {
        try {
            const response = await api.get(`/teams/${groupId}/members`, { params: { churchId } });
            return response.data.users || [];
        } catch (error) {
            console.error('Failed to fetch team members', error);
            return [];
        }
    },

    getMyTeamMembers: async (churchId?: number): Promise<any[]> => {
        try {
            const response = await api.get('/people/team_members', { params: { churchId } });
            return response.data.success ? response.data.users : [];
        } catch (error) {
            console.error('Failed to fetch my team members', error);
            return [];
        }
    },

    approveUser: async (memberId: number, roleId: number, groups: number[] = [], areaIds: number[] = []): Promise<boolean> => {
        try {
            await api.post(`/people/${memberId}/approve`, { roleId, groups, areaIds });
            return true;
        } catch (error) {
            console.error('Failed to approve user', error);
            return false;
        }
    },

    getMemberAreas: async (memberId: number): Promise<number[]> => {
        try {
            const response = await api.get(`/people/${memberId}/areas`);
            return response.data.areaIds || [];
        } catch (error) {
            console.error('Failed to fetch member areas', error);
            return [];
        }
    },

    updateMemberProfile: async (memberId: number, data: any): Promise<boolean> => {
        try {
            await api.put(`/people/${memberId}/profile`, data);
            return true;
        } catch (error) {
            console.error('Failed to update member profile', error);
            return false;
        }
    },

    updateGroup: async (id: number, data: any): Promise<boolean> => {
        try {
            await api.put(`/teams/${id}`, data);
            return true;
        } catch (error) {
            console.error('Failed to update group', error);
            return false;
        }
    }

};
