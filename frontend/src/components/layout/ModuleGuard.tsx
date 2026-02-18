import type { FC } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ModuleGuardProps {
    moduleKey: string;
}

export const ModuleGuard: FC<ModuleGuardProps> = ({ moduleKey }) => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Master has access to everything
    if (user?.role?.name === 'master') {
        return <Outlet />;
    }

    // Check if user has access to this module
    const hasAccess = user?.services?.some(s => s.serviceKey === moduleKey && s.enabled);

    if (!hasAccess) {
        // Redirect to their first available module, or profile if none
        const firstModule = user?.services?.find(s => s.enabled)?.serviceKey;
        return <Navigate to={firstModule ? `/${firstModule}` : "/profile"} replace />;
    }

    return <Outlet />;
};
