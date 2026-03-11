/**
 * MSM2 - Permisos por Rol (Single Source of Truth)
 * 
 * Este archivo centraliza toda la lógica de acceso de la aplicación.
 * Basado en el archivo "Permisos por rol - Vista.csv" de NotebookLM.
 * 
 * CRÍTICO: No modificar este archivo sin permiso explícito del programador.
 */

export type UserRole = 'superadmin' | 'pastor' | 'leader' | 'coordinator' | 'member' | string;

export interface PermissionMatrix {
    [routeOrAction: string]: UserRole[];
}

export const PERMISSIONS_MATRIX: PermissionMatrix = {
    // Shared / Core
    '/dashboard': ['superadmin', 'pastor'],
    '/profile': ['superadmin', 'pastor', 'leader', 'coordinator', 'member'],
    '/settings': ['superadmin', 'pastor', 'leader', 'coordinator', 'member'],
    '/settings/invitations': ['superadmin', 'pastor', 'leader'],
    '/privacy': ['superadmin', 'pastor', 'leader', 'coordinator', 'member'],
    '/social': ['superadmin', 'pastor', 'leader', 'coordinator', 'member'],

    // Worship Hub
    '/worship': ['superadmin', 'pastor', 'leader', 'coordinator', 'member'],
    '/worship/songs': ['superadmin', 'pastor', 'leader', 'coordinator', 'member'],
    '/worship/songs/view': ['superadmin', 'pastor', 'leader', 'coordinator', 'member'],
    '/worship/songs/edit': ['superadmin', 'pastor', 'leader', 'coordinator'],
    '/worship/songs/approvals': ['superadmin', 'pastor', 'leader'],
    '/worship/playlists': ['superadmin', 'pastor', 'leader', 'coordinator', 'member'],
    '/worship/calendar': ['superadmin', 'pastor', 'leader', 'coordinator', 'member'],

    // MainHub (Pastoral/Admin)
    '/mainhub': ['superadmin', 'pastor', 'leader', 'coordinator'],
    '/mainhub/people': ['superadmin', 'pastor'],
    '/mainhub/people/approvals': ['superadmin', 'pastor', 'leader'],
    '/mainhub/people/invite': ['superadmin', 'pastor', 'leader', 'coordinator'],
    '/mainhub/teams': ['superadmin', 'pastor', 'leader'],
    '/mainhub/my-team': ['superadmin', 'pastor', 'leader', 'coordinator'],
    '/mainhub/reports': ['superadmin', 'pastor'],
    '/mainhub/consolidation': ['superadmin', 'pastor'],
    '/mainhub/attendance': ['superadmin', 'pastor'],
    '/mainhub/visitor': ['superadmin', 'pastor'],
    '/mainhub/master': ['superadmin'],
    '/mainhub/pastor': ['pastor', 'superadmin'], // superadmin allowed everywhere
    '/mainhub/churches': ['superadmin', 'pastor'],
    '/mainhub/churches/edit': ['superadmin'],
    '/mainhub/areas': ['superadmin', 'pastor'],
    '/mainhub/setup-areas': ['superadmin', 'pastor'],
    '/mainhub/setup-teams': ['superadmin', 'pastor', 'leader'],
    '/mainhub/select-church': ['superadmin'],
    '/mainhub/admin/permissions': ['superadmin'],
    '/mainhub/join-teams': ['member'],

    // Modals / Actions
    'action.meeting.edit': ['superadmin', 'pastor', 'leader'],
    'action.meeting.view_detail': ['superadmin', 'pastor', 'leader'],
    'action.meeting.list_by_date': ['superadmin', 'pastor', 'leader', 'coordinator', 'member'],
    'action.meeting.assign_staff': ['superadmin', 'pastor'],
    'action.meeting.assign_setlist': ['superadmin', 'pastor', 'leader', 'coordinator'],
    'action.people.edit_profile': ['superadmin', 'pastor', 'leader'],
    'action.team.config': ['superadmin', 'pastor', 'leader'],
    'action.team.create': ['superadmin', 'pastor', 'leader'],
    'action.instruments.manage': ['leader', 'coordinator', 'member'],
    'action.area.edit': ['superadmin', 'pastor'],
    'action.church.selector': ['superadmin'],
    'action.notifications.view': ['superadmin', 'pastor', 'leader', 'coordinator', 'member'],
    'action.playlist.manage': ['superadmin', 'pastor', 'leader', 'coordinator'],
};

/**
 * Verifica si un rol tiene acceso a una ruta o acción específica.
 * El rol 'superadmin' siempre tiene acceso a todo (bypass).
 */
export const canAccess = (role: string | undefined, identifier: string): boolean => {
    if (!role) return false;
    const lowerRole = role.toLowerCase();
    
    // Superadmin bypass
    if (lowerRole === 'superadmin') return true;
    
    // Check matrix
    const allowedRoles = PERMISSIONS_MATRIX[identifier];
    if (!allowedRoles) {
        // Simple path matching for dynamic routes like /worship/songs/123
        const baseRoute = Object.keys(PERMISSIONS_MATRIX).find(key => 
            key.includes(':') && identifier.startsWith(key.split(':')[0])
        );
        if (baseRoute) return PERMISSIONS_MATRIX[baseRoute].includes(lowerRole);
        return false;
    }
    
    return allowedRoles.includes(lowerRole);
};

/**
 * Obtiene el Home por defecto para un rol.
 */
export const getDefaultHome = (role: string | undefined): string => {
    if (!role) return '/login';
    const r = role.toLowerCase();
    if (r === 'superadmin') return '/mainhub/master';
    if (r === 'pastor') return '/mainhub/pastor';
    if (r === 'leader' || r === 'coordinator') return '/worship';
    if (r === 'member') return '/worship/playlists';
    return '/dashboard';
};
