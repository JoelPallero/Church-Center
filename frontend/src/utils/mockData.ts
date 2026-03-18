import type { User, Church, UserRoleName } from '../types/domain';

export const MOCK_CHURCH: Church = {
    id: 1,
    name: 'Iglesia Dev Local',
    slug: 'iglesia-dev',
    subscriptionPlan: 'enterprise'
};

const createMockUser = (roleName: UserRoleName, id: number, name: string, areaName: string = 'Alabanza', serviceKey: string = 'worship'): User => {
    const isSuperAdmin = roleName === 'superadmin' || roleName === 'master';

    return {
        id,
        name,
        email: `${roleName}@dev.local`,
        churchId: isSuperAdmin ? null : 1,
        roleId: 0,
        statusId: 1,
        status: 'active',
        isMaster: isSuperAdmin,
        role: {
            id: 0,
            name: roleName,
            displayName: roleName.charAt(0).toUpperCase() + roleName.slice(1),
            level: isSuperAdmin ? 0 : 100,
            isSystemRole: true
        },
        services: [
            { serviceKey, enabled: true },
            { serviceKey: 'mainhub', enabled: true },
            { serviceKey: 'social', enabled: true }
        ],
        areas: [
            { id: 1, name: areaName }
        ]
    };
};

export const MOCK_PROFILES: Record<string, { user: User; permissions: string[]; roles: string[] }> = {
    superadmin: {
        user: createMockUser('superadmin', 1, 'Dev SuperAdmin'),
        permissions: ['*'],
        roles: ['superadmin']
    },
    master: {
        user: createMockUser('master', 1, 'Dev Master'),
        permissions: ['*'],
        roles: ['superadmin', 'master']
    },
    pastor: {
        user: createMockUser('pastor', 2, 'Dev Pastor'),
        permissions: [
            'church.update_own',
            'reports.view',
            'calendar.read',
            'song.read',
            'team.read',
            'people.read',
            'people.write',
            'church.view_own'
        ],
        roles: ['pastor']
    },
    leader: {
        user: createMockUser('leader', 3, 'Dev Lider Ujieres', 'Ujieres', 'ushers'),
        permissions: [
            'calendar.read',
            'team.read',
            'person.read',
            'reunions.view'
        ],
        roles: ['leader']
    },
    leader_worship: {
        user: createMockUser('leader', 33, 'Dev Lider Alabanza', 'Alabanza', 'worship'),
        permissions: [
            'calendar.read',
            'song.read',
            'team.read',
            'song.write',
            'song.create',
            'song.update'
        ],
        roles: ['leader']
    },
    coordinator: {
        user: createMockUser('coordinator', 4, 'Dev Coordinador'),
        permissions: [
            'calendar.read',
            'song.read',
            'team.read',
            'song.create',
            'song.update',
            'song.write'
        ],
        roles: ['coordinator']
    },
    member: {
        user: createMockUser('member', 5, 'Dev Miembro'),
        permissions: [
            'calendar.read',
            'song.read'
        ],
        roles: ['member']
    },
    ujier: {
        user: createMockUser('ujier', 6, 'Dev Ujier', 'Ujieres', 'ushers'),
        permissions: [
            'person.read',
            'calendar.read',
            'reunions.view'
        ],
        roles: ['ujier']
    }
};
