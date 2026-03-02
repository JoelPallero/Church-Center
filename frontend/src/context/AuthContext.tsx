import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { AuthService } from '../services/authService';
import type { User, Church } from '../types/domain';

interface AuthContextType {
    user: User | null;
    church: Church | null;
    roles: string[];
    permissions: string[];
    services: string[];
    isSuperAdmin: boolean;
    isMaster: boolean;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
    logout: () => void;
    register: (name: string, email: string) => Promise<any>;
    impersonateRole: (roleName: string | null) => void;
    isLocalhost: boolean;
    hasPermission: (permission: string) => boolean;
    hasService: (serviceKey: string) => boolean;
    hasRole: (roleName: string) => boolean;
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

    const isLocalhost = useMemo(() =>
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.port === '5173'
        , []);

    const loadBootstrap = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');

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
    }, []);

    useEffect(() => {
        loadBootstrap();
    }, [loadBootstrap]);

    const login = async (email: string, password: string, recaptchaToken?: string) => {
        setIsLoading(true);
        try {
            const response = await AuthService.login(email, password, recaptchaToken);
            if (response.success && response.access_token) {
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

    const register = async (name: string, email: string) => {
        return await AuthService.register(name, email);
    };

    const logout = useCallback(() => {
        AuthService.logout();
        setUser(null);
        setChurch(null);
        setRoles([]);
        setPermissions([]);
        setServices([]);
        setIsSuperAdmin(false);
        setImpersonatedRole(null);
    }, []);

    const impersonateRole = (roleName: string | null) => {
        if (!isLocalhost) return;
        if (!roleName) {
            setImpersonatedRole(null);
            return;
        }
        setImpersonatedRole({
            id: 0,
            name: roleName,
            displayName: roleName.toUpperCase(),
            level: 10,
            isSystemRole: true
        });
    };

    const hasPermission = (permission: string) => {
        if (isSuperAdmin) return true;
        return permissions.includes(permission);
    };

    const hasService = (serviceKey: string) => {
        if (isSuperAdmin) return true;
        return services.includes(serviceKey);
    };

    const hasRole = (roleName: string) => {
        if (isSuperAdmin && roleName === 'superadmin') return true;
        return roles.includes(roleName);
    };

    const currentUser = useMemo((): User | null => {
        if (!user) return null;
        if (!impersonatedRole) return user;
        return {
            ...user,
            role: impersonatedRole,
            isMaster: impersonatedRole.name === 'master'
        };
    }, [user, impersonatedRole]);

    return (
        <AuthContext.Provider value={{
            user: currentUser,
            church,
            roles,
            permissions,
            services,
            isSuperAdmin,
            isMaster: isSuperAdmin || user?.isMaster || impersonatedRole?.name === 'master',
            isLoading,
            isAuthenticated: !!currentUser,
            login,
            logout,
            register,
            impersonateRole,
            isLocalhost,
            hasPermission,
            hasService,
            hasRole
        }}>
            {children}
        </AuthContext.Provider>
    );
};
export type { User, UserRoleName } from '../types/domain';
