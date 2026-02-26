import type { FC } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ModuleGuardProps {
    moduleKey: string;
}

export const ModuleGuard: FC<ModuleGuardProps> = ({ moduleKey }) => {
    const { services, isAuthenticated, isSuperAdmin, isLoading, hasService } = useAuth();

    if (isLoading) {
        return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Master/Superadmin has access to everything
    if (isSuperAdmin || hasService(moduleKey)) {
        return <Outlet />;
    }

    // Redirect to their first available module, or profile if none
    const firstModule = services.length > 0 ? services[0] : undefined;

    return <Navigate to={firstModule ? `/${firstModule}` : "/profile"} replace />;
};
