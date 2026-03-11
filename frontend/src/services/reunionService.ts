import api from './api';

export interface Reunion {
    id: number;
    title: string;
    date: string;
    time: string;
    meetingType: string;
}

export const reunionService = {
    getUpcoming: async (churchId?: number): Promise<Reunion[]> => {
        try {
            const now = new Date().toISOString().split('T')[0];
            const response = await api.get(`/calendar/events?start=${now}&church_id=${churchId || ''}`);
            const data = response.data;
            if (data.success && Array.isArray(data.instances)) {
                return data.instances.map((m: any) => ({
                    id: m.id,
                    title: m.title,
                    date: m.start_at?.split(' ')[0] || '',
                    time: m.start_at?.split(' ')[1]?.substring(0, 5) || m.start_time?.substring(0, 5) || '',
                    meetingType: m.meeting_type
                }));
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch upcoming reunions', error);
            return [];
        }
    }
};
