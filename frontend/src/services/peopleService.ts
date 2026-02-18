import api from './api';
import type { User } from '../types/domain';

export type UserStatus = 'active' | 'inactive' | 'pending';


export const peopleService = {
    getAll: async (): Promise<User[]> => {
        try {
            const response = await api.get('/people.php?action=list');
            return response.data.success ? response.data.users : [];
        } catch (error) {
            console.error('Failed to fetch people', error);
            return [];
        }
    },

    getTeam: async (): Promise<User[]> => {
        try {
            const response = await api.get('/people.php?action=team');
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
            const response = await api.post('/people.php?action=update_role', { userId, roleId });
            return response.data.success;
        } catch (error) {
            console.error('Failed to update role', error);
            return false;
        }
    },

    updateStatus: async (userId: number, statusId: number): Promise<boolean> => {
        try {
            const response = await api.post('/people.php?action=update_status', { userId, statusId });
            return response.data.success;
        } catch (error) {
            console.error('Failed to update status', error);
            return false;
        }
    },

    deleteMember: async (memberId: number): Promise<boolean> => {
        try {
            const response = await api.post('/people.php?action=delete_member', { memberId });
            return response.data.success;
        } catch (error) {
            console.error('Failed to delete member', error);
            return false;
        }
    },

    invite: async (name: string, email: string, roleId: number): Promise<boolean> => {
        try {
            const response = await api.post('/people.php?action=invite', { name, email, roleId });
            return response.data.success;
        } catch (error) {
            console.error('Failed to invite person', error);
            return false;
        }
    },

    bulkInvite: async (emails: string[]): Promise<any> => {
        try {
            const response = await api.post('/people.php?action=bulk_invite', { emails });
            return response.data;
        } catch (error) {
            console.error('Failed bulk invite', error);
            return { success: 0, failed: emails.length, errors: ['Request failed'] };
        }
    },

    resendInvitation: async (email: string): Promise<boolean> => {
        try {
            const response = await api.post('/people.php?action=resend_invite', { email });
            return response.data.success;
        } catch (error) {
            console.error('Failed to resend invitation', error);
            return false;
        }
    },

    deleteInvitation: async (email: string): Promise<boolean> => {
        try {
            const response = await api.post('/people.php?action=delete_invite', { email });
            return response.data.success;
        } catch (error) {
            console.error('Failed to delete invitation', error);
            return false;
        }
    },

    getGroups: async (areaId?: number): Promise<any[]> => {
        try {
            const url = areaId ? `/people.php?action=list_groups&areaId=${areaId}` : '/people.php?action=list_groups';
            const response = await api.get(url);
            return response.data.groups || [];
        } catch (error) {
            console.error('Failed to fetch groups', error);
            return [];
        }
    },

    getAreas: async (): Promise<any[]> => {
        try {
            const response = await api.get('/people.php?action=list_areas');
            return response.data.areas || [];
        } catch (error) {
            console.error('Failed to fetch areas', error);
            return [];
        }
    },

    joinGroup: async (groupId: number): Promise<boolean> => {
        try {
            const response = await api.post('/people.php?action=join_group', { groupId });
            return response.data.success;
        } catch (error) {
            console.error('Failed to join group', error);
            return false;
        }
    },

    saveInstruments: async (instruments: number[]): Promise<boolean> => {
        try {
            const response = await api.post('/people.php?action=save_instruments', { instruments });
            return response.data.success;
        } catch (error) {
            console.error('Failed to save instruments', error);
            return false;
        }
    },

    getInstruments: async (): Promise<any[]> => {
        try {
            const response = await api.get('/people.php?action=list_instruments');
            return response.data.instruments || [];
        } catch (error) {
            console.error('Failed to fetch instruments', error);
            return [];
        }
    },

    getRoles: async (): Promise<any[]> => {
        try {
            const response = await api.get('/people.php?action=list_roles');
            return response.data.roles || [];
        } catch (error) {
            console.error('Failed to fetch roles', error);
            return [];
        }
    },

    addGroup: async (name: string, leaderId: number | null = null, areaId: number | null = null, description: string = '', isServiceTeam: boolean = true): Promise<any> => {
        try {
            const response = await api.post('/people.php?action=add_group', { name, leaderId, areaId, description, isServiceTeam });
            if (response.data.success) return response.data;
            return null;
        } catch (error) {
            console.error('Failed to add group', error);
            return null;
        }
    },

    addArea: async (name: string): Promise<boolean> => {
        try {
            const response = await api.post('/people.php?action=add_area', { name });
            return response.data.success;
        } catch (error) {
            console.error('Failed to add area', error);
            return false;
        }
    },

    assignTeam: async (memberId: number, teamId: number, roleInGroup: string): Promise<boolean> => {
        try {
            const response = await api.post('/people.php?action=assign_team', { memberId, teamId, roleInGroup });
            return response.data.success;
        } catch (error) {
            console.error('Failed to assign team', error);
            return false;
        }
    },

    deleteGroup: async (groupId: number): Promise<boolean> => {
        try {
            const response = await api.post('/people.php?action=delete_group', { groupId });
            return response.data.success;
        } catch (error) {
            console.error('Failed to delete group', error);
            return false;
        }
    },

    assignTeamBulk: async (groupId: number, memberIds: number[]): Promise<boolean> => {
        try {
            const response = await api.post('/people.php?action=assign_team_bulk', { groupId, memberIds });
            return response.data.success;
        } catch (error) {
            console.error('Failed bulk assignment', error);
            return false;
        }
    },

    getTeamMembers: async (groupId: number): Promise<any[]> => {
        try {
            const response = await api.get(`/people.php?action=list_group_members&groupId=${groupId}`);
            return response.data.users || [];
        } catch (error) {
            console.error('Failed to fetch team members', error);
            return [];
        }
    },

    getMyTeamMembers: async (): Promise<any[]> => {
        try {
            const response = await api.get('/people.php?action=my_team_members');
            return response.data.success ? response.data.users : [];
        } catch (error) {
            console.error('Failed to fetch my team members', error);
            return [];
        }
    },

    approveUser: async (memberId: number, roleId: number, groups: number[] = [], areaIds: number[] = []): Promise<boolean> => {
        try {
            const response = await api.post('/people.php?action=approve_user', { memberId, roleId, groups, areaIds });
            return response.data.success;
        } catch (error) {
            console.error('Failed to approve user', error);
            return false;
        }
    },

    getMemberAreas: async (memberId: number): Promise<number[]> => {
        try {
            const response = await api.get(`/people.php?action=get_member_areas&memberId=${memberId}`);
            return response.data.areaIds || [];
        } catch (error) {
            console.error('Failed to fetch member areas', error);
            return [];
        }
    },

    updateMemberProfile: async (memberId: number, data: any): Promise<boolean> => {
        try {
            const response = await api.post('/people.php?action=update_member_profile', { memberId, ...data });
            return response.data.success;
        } catch (error) {
            console.error('Failed to update member profile', error);
            return false;
        }
    }

};
