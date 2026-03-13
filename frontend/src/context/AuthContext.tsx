import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { AuthService } from '../services/authService';
import type { User, Church } from '../types/domain';
import { MOCK_PROFILES, MOCK_CHURCH } from '../utils/mockData';
import { canAccess as canAccessGlobal } from '../config/permissionsConfig';

interface AuthContextType {
    user: User | null;
    church: Church | null;
    roles: string[];
    permissions: string[];
    services: string[];
    isSuperAdmin: boolean;
    isMaster: boolean;
    isPastor: boolean;
    isUjier: boolean;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
    loginAsMock: (profileKey: string) => void;
    logout: () => void;
    register: (name: string, email: string) => Promise<any>;
    impersonateRole: (roleName: string | null) => void;
    isLocalhost: boolean;
    isMockMode: boolean;
    hasPermission: (permission: string) => boolean;
    hasService: (serviceKey: string) => boolean;
    canAccess: (identifier: string) => boolean;
    hasRole: (roleName: string) => boolean;
    canManageSongs: boolean;
    canManagePlaylists: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [church, setChurch] = useState<Church | null>(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [services, setServices] = useState<string[]>([]);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [impersonatedRole, setImpersonatedRole] = useState<any>(null);
    const [isMockMode, setIsMockMode] = useState(false);

    const isLocalhost = useMemo(() =>
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.port === '5173'
        , []);

    const loadBootstrap = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        const mockProfile = localStorage.getItem('dev_mock_profile');

        if (isLocalhost && mockProfile && MOCK_PROFILES[mockProfile]) {
            const profile = MOCK_PROFILES[mockProfile];
            setUser(profile.user);
            setChurch(MOCK_CHURCH);
            setRoles(profile.roles);
            setPermissions(profile.permissions);
            setServices(profile.user.services?.map(s => s.serviceKey) || []);
            setIsSuperAdmin(profile.roles.includes('superadmin'));
            setIsMockMode(true);
            setIsLoading(false);
            return;
        }

        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            const response = await AuthService.getBootstrap();
            if (response.success && response.data) {
                const { user: rawUser, church: rawChurch, permissions: rawPerms, services: rawServs, is_superadmin, roles: rawRoles } = response.data;

                // Exact hydration based on domain.ts expectations
                const mainRole = (rawRoles || []).includes('superadmin') ? 'superadmin' : (rawRoles[0] || 'member');
                const hydratedUser: User = {
                    ...rawUser,
                    churchId: rawUser.church_id || null,
                    roleId: 0, // Mock for type compatibility
                    statusId: (rawUser.status === 'active' || !rawUser.status) ? 1 : 2,
                    isMaster: is_superadmin || mainRole === 'superadmin' || mainRole === 'master',
                    role: {
                        id: 0,
                        name: mainRole as any,
                        displayName: is_superadmin ? 'Super Administrador' : (mainRole.charAt(0).toUpperCase() + mainRole.slice(1)),
                        level: (is_superadmin || mainRole === 'superadmin') ? 0 : 100,
                        isSystemRole: true
                    },
                    services: (rawServs || []).map((key: string) => ({
                        serviceKey: key,
                        enabled: true
                    }))
                };

                setUser(hydratedUser);
                setChurch(rawChurch);
                setPermissions(rawPerms || []);
                setServices(rawServs || []);
                setRoles(rawRoles || []);
                setIsSuperAdmin(is_superadmin || false);
                setIsMockMode(false);
            } else {
                localStorage.removeItem('auth_token');
                setUser(null);
            }
        } catch (error) {
            console.error('Bootstrap failed:', error);
            localStorage.removeItem('auth_token');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, [isLocalhost]);

    useEffect(() => {
        loadBootstrap();
    }, [loadBootstrap]);

    const login = async (email: string, password: string, recaptchaToken?: string) => {
        setIsLoading(true);
        try {
            const response = await AuthService.login(email, password, recaptchaToken);
            if (response.success && response.access_token) {
                localStorage.removeItem('dev_mock_profile');
                localStorage.setItem('auth_token', response.access_token);
                await loadBootstrap();
            } else {
                throw new Error(response.error || 'Login failed');
            }
        } catch (error: any) {
            setIsLoading(false);
            throw error;
        }
    };

    const loginAsMock = useCallback((profileKey: string) => {
        if (!isLocalhost) return;
        localStorage.setItem('dev_mock_profile', profileKey);
        localStorage.removeItem('auth_token');
        loadBootstrap();
    }, [isLocalhost, loadBootstrap]);

    const register = async (name: string, email: string) => {
        return await AuthService.register(name, email);
    };

    const logout = useCallback(() => {
        AuthService.logout();
        localStorage.removeItem('dev_mock_profile');
        setUser(null);
        setChurch(null);
        setRoles([]);
        setPermissions([]);
        setServices([]);
        setIsSuperAdmin(false);
        setImpersonatedRole(null);
        setIsMockMode(false);
    }, []);

    const impersonateRole = useCallback((roleName: string | null) => {
        if (!isLocalhost) return;
        if (!roleName) {
            setImpersonatedRole(null);
            loadBootstrap();
            return;
        }

        // Apply mock permissions if available
        if (MOCK_PROFILES[roleName]) {
            const profile = MOCK_PROFILES[roleName];
            setPermissions(profile.permissions);
            setRoles(profile.roles);
            setServices(profile.user.services?.map(s => s.serviceKey) || []);
            setIsSuperAdmin(profile.roles.includes('superadmin'));
        }

        setImpersonatedRole({
            id: 0,
            name: roleName,
            displayName: roleName.toUpperCase(),
            level: 10,
            isSystemRole: true
        });
    }, [isLocalhost, loadBootstrap]);

    const canAccess = useCallback((identifier: string) => {
        // Hub-level check: if a path belongs to a module, check if that module is enabled/assigned
        // Worship Hub
        if (identifier.startsWith('/worship') && !services.includes('worship') && !isSuperAdmin) return false;
        // Social Hub
        if (identifier.startsWith('/social') && !services.includes('social') && !isSuperAdmin) return false;
        // Consolidation Hub
        if (identifier.startsWith('/mainhub/consolidation') && !services.includes('consolidation') && !isSuperAdmin) return false;

        if (isSuperAdmin) return true;
        if (impersonatedRole) return canAccessGlobal(impersonatedRole.name, identifier);
        // Multi-role support: if any of the user's roles has access, return true
        return roles.some(role => canAccessGlobal(role, identifier));
    }, [roles, services, impersonatedRole, isSuperAdmin]);

    const hasPermission = useCallback((permission: string) => {
        if (isSuperAdmin) return true;
        // Check both matrix AND permission list (for multi-level security)
        return canAccess(`action.${permission}`) || permissions.includes(permission);
    }, [isSuperAdmin, permissions, canAccess]);

    const hasService = useCallback((serviceKey: string) => {
        if (isSuperAdmin) return true;
        // For services, we check the module root in matrix
        return canAccess(`/${serviceKey}`) || services.includes(serviceKey);
    }, [isSuperAdmin, services, canAccess]);

    const hasRole = useCallback((roleName: string) => {
        const lowerRole = roleName.toLowerCase();
        if (isSuperAdmin && lowerRole === 'superadmin') return true;
        return roles.map(r => r.toLowerCase()).includes(lowerRole);
    }, [isSuperAdmin, roles]);

    const currentUser = useMemo((): User | null => {
        if (!user) return null;
        if (!impersonatedRole) return user;
        return {
            ...user,
            role: impersonatedRole,
            isMaster: impersonatedRole.name === 'master' || impersonatedRole.name === 'superadmin'
        };
    }, [user, impersonatedRole]);

    const canManageSongs = useMemo(() => {
        return canAccess('/worship/songs/edit');
    }, [canAccess]);

    const canManagePlaylists = useMemo(() => {
        return canAccess('action.playlist.manage');
    }, [canAccess]);

    return (
        <AuthContext.Provider value={{
            user: currentUser,
            church,
            roles,
            permissions,
            services,
            isSuperAdmin,
            isMaster: isSuperAdmin || user?.isMaster || impersonatedRole?.name === 'master',
            isPastor: roles.includes('pastor') || user?.role?.name === 'pastor' || impersonatedRole?.name === 'pastor',
            isUjier: roles.includes('ujier') || user?.role?.name === 'ujier' || impersonatedRole?.name === 'ujier',
            isLoading,
            isAuthenticated: !!currentUser,
            login,
            loginAsMock,
            logout,
            register,
            impersonateRole,
            isLocalhost,
            isMockMode,
            hasPermission,
            hasService,
            canAccess,
            hasRole,
            canManageSongs,
            canManagePlaylists
        }}>
            {children}
        </AuthContext.Provider>
    );
};
export type { User, UserRoleName } from '../types/domain';
