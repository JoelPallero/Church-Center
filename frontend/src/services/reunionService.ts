export interface Reunion {
    id: string;
    title: string;
    date: string;
    time: string;
    teamId?: string;
}

const MOCK_REUNIONS: Reunion[] = [
    { id: '1', title: 'Sunday Service', date: '2026-02-15', time: '10:00', teamId: 'worship-team-1' },
    { id: '2', title: 'Midweek Prayer', date: '2026-02-18', time: '19:00', teamId: 'prayer-team' },
    { id: '3', title: 'Youth Meeting', date: '2026-02-20', time: '20:00', teamId: 'youth-lead' },
];

export const reunionService = {
    getUpcoming: async (): Promise<Reunion[]> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_REUNIONS;
    }
};
