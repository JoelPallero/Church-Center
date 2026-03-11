import type { FC } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDefaultHome } from '../../config/permissionsConfig';

interface ModuleGuardProps {
    moduleKey: string;
}

export const ModuleGuard: FC<ModuleGuardProps> = ({ moduleKey }) => {
    const { isAuthenticated, isLoading, canAccess, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    }

    if (!isAuthenticated) {
        const redirectPath = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?redirect=${redirectPath}`} replace />;
    }

    // Check if the user can access this module root
    if (canAccess(`/${moduleKey}`)) {
        return <Outlet />;
    }

    return <Navigate to={getDefaultHome(user?.role?.name)} replace />;
};
