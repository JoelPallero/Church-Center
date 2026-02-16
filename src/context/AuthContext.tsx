import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { AuthService } from '../services/authService';
import type { User, UserRole, UserRoleName } from '../types/domain';

export type { User, UserRole, UserRoleName };

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    permissions: string[];
    hasPermission: (permission: string) => boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string) => Promise<any>;
    logout: () => void;
    impersonateRole: (roleName: string | null) => void;
    isLocalhost: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [impersonatedRole, setImpersonatedRole] = useState<any>(null);

    const isLocalhost = useMemo(() =>
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.port === '5173'
        , []);

    const loadUser = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');

        if (token) {
            try {
                const data = await AuthService.me();
                if (data.success) {
                    setUser(data.user);
                    setPermissions(data.permissions || []);
                } else {
                    localStorage.removeItem('auth_token');
                }
            } catch (err) {
                console.error('Auth check failed:', err);
                localStorage.removeItem('auth_token');
            }
        } else if (isLocalhost) {
            // Auto-login on localhost if no token exists
            const devUser: User = {
                id: 1,
                name: 'Dev Master',
                email: 'admin@system.master',
                churchId: 1,
                roleId: 1,
                statusId: 1,
                role: { name: 'master', level: 0 } as UserRole
            };
            setUser(devUser);
            setPermissions([]); // Master has all permissions anyway
        }
        setIsLoading(false);
    }, [isLocalhost]);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const login = async (email: string, password: string) => {
        const data = await AuthService.login(email, password);
        if (data.success) {
            setUser(data.user);
            const meData = await AuthService.me();
            if (meData.success) {
                setPermissions(meData.permissions || []);
            }
        }
    };

    const register = async (name: string, email: string) => {
        const data = await AuthService.register(name, email);
        if (data.success) {
            setUser(data.user);
            setPermissions([]);
        }
        return data;
    };

    const logout = () => {
        AuthService.logout();
        setUser(null);
        setPermissions([]);
        setImpersonatedRole(null);
    };

    const impersonateRole = (roleName: string | null) => {
        if (!isLocalhost) return;

        if (!roleName) {
            setImpersonatedRole(null);
            return;
        }

        const rolesMap: Record<string, number> = {
            'master': 0,
            'pastor': 10,
            'leader': 30,
            'coordinator': 40,
            'member': 100,
            'guest': 200
        };

        setImpersonatedRole({
            name: roleName,
            level: rolesMap[roleName] || 100
        });
    };

    const currentUser = impersonatedRole ? { ...user, role: impersonatedRole } : user;

    const hasPermission = (permission: string) => {
        if (!currentUser || !currentUser.role) return false;
        if (currentUser.role.name === 'master') return true;
        return permissions.includes(permission);
    };

    return (
        <AuthContext.Provider value={{
            user: currentUser as any,
            isLoading,
            isAuthenticated: !!currentUser,
            permissions,
            hasPermission,
            login,
            register,
            logout,
            impersonateRole,
            isLocalhost
        }}>
            {children}
        </AuthContext.Provider>
    );
};
