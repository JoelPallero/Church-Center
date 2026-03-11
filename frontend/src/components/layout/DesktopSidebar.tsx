import { type FC } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';

export const DesktopSidebar: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { canAccess, logout, user, isSuperAdmin } = useAuth();
    const isPastor = user?.role?.name?.toLowerCase() === 'pastor';
    const isLeader = user?.role?.name?.toLowerCase() === 'leader' || user?.role?.name?.toLowerCase() === 'coordinator';
    const isMember = user?.role?.name?.toLowerCase() === 'member';

    const menuItems = [
        { path: '/dashboard', icon: 'dashboard', label: (isPastor || isSuperAdmin || isLeader) ? 'Dashboard' : t('nav.home') },
        { path: '/mainhub/reports', icon: 'auto_graph', label: (isPastor || isSuperAdmin || isLeader) ? 'Reportes' : 'Estadísticas' },
        { path: '/mainhub/churches', icon: 'church', label: isSuperAdmin ? 'Iglesias' : (isPastor ? 'Mi Iglesia' : (isLeader ? 'Mi Iglesia' : t('nav.churches'))) },
        { path: '/worship/calendar', icon: 'event', label: isSuperAdmin ? 'Calendarios' : (isPastor ? 'Calendario' : (isLeader ? 'Calendario' : t('nav.calendar'))) },
        { path: '/worship/songs', icon: 'library_music', label: isSuperAdmin ? 'Biblioteca' : (isPastor ? 'Biblioteca' : (isLeader ? 'Biblioteca' : t('nav.songs'))) },
        { path: '/mainhub/people', icon: 'person_search', label: isSuperAdmin ? 'Personas' : (isPastor ? 'Personas' : (isLeader ? 'Personas' : t('nav.people'))) },
        { path: '/mainhub/areas', icon: 'layers', label: (isPastor || isLeader) ? 'Areas' : t('nav.areas') },
        { path: '/worship/playlists', icon: 'queue_music', label: (isPastor || isLeader || isMember) ? 'Listados' : t('nav.playlists') },
        { path: '/mainhub/teams', icon: 'groups', label: (isPastor || isLeader) ? 'Equipos' : t('nav.teams') },
        { path: '/mainhub/my-team', icon: 'diversity_3', label: 'Mi Equipo' },
        { path: '/mainhub/consolidation', icon: 'how_to_reg', label: t('nav.consolidation') },
    ];

    // Priority sorting
    let visibleItems = menuItems.filter(item => canAccess(item.path));
    
    if (isSuperAdmin) {
        const superOrder = ['/dashboard', '/mainhub/reports', '/mainhub/churches', '/worship/calendar', '/worship/songs', '/mainhub/people'];
        visibleItems = superOrder
            .map(path => visibleItems.find(item => item.path === path))
            .filter((item): item is typeof menuItems[0] => !!item);
    } else if (isPastor) {
        const pastorOrder = ['/dashboard', '/mainhub/reports', '/worship/calendar', '/mainhub/churches', '/mainhub/areas', '/worship/playlists', '/worship/songs', '/mainhub/teams', '/mainhub/people'];
        visibleItems = pastorOrder
            .map(path => visibleItems.find(item => item.path === path))
            .filter((item): item is typeof menuItems[0] => !!item);
    } else if (isLeader) {
        const leaderOrder = ['/dashboard', '/mainhub/reports', '/worship/calendar', '/mainhub/churches', '/mainhub/areas', '/worship/playlists', '/worship/songs', '/mainhub/teams', '/mainhub/my-team', '/mainhub/people'];
        visibleItems = leaderOrder
            .map(path => visibleItems.find(item => item.path === path))
            .filter((item): item is typeof menuItems[0] => !!item);
    }

    return (
        <aside style={{
            width: 'var(--sidebar-width)',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            backgroundColor: 'var(--color-sidebar-bg)',
            borderRight: '1px solid var(--color-border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingBottom: '20px',
            zIndex: 1000
        }} className="desktop-only">
            <div>
                <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <img src="/favicon.png" alt="Logo" style={{ width: '32px', height: '32px' }} />
                    <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--color-brand-blue)' }}>Service Manager</span>
                </div>

                <nav style={{ padding: '12px', overflowY: 'auto' }}>
                    {visibleItems.map(item => {
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/dashboard'}
                                className={({ isActive }) => clsx('nav-link', isActive ? 'text-brand-blue' : 'text-gray-500')}
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    marginBottom: '4px',
                                    backgroundColor: isActive ? 'rgba(63, 108, 222, 0.1)' : 'transparent',
                                    color: isActive ? 'var(--color-brand-blue)' : 'var(--color-ui-text-soft)',
                                    transition: 'all 0.2s',
                                    textDecoration: 'none'
                                })}
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                                        <span style={{ fontWeight: isActive ? 600 : 500, fontSize: '14px' }}>{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            <div style={{ padding: '12px', borderTop: '1px solid var(--color-border-subtle)', marginTop: 'auto' }}>
                <NavLink
                    to="/settings"
                    className={({ isActive }) => clsx('nav-link', isActive ? 'text-brand-blue' : 'text-gray-500')}
                    style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        marginBottom: '4px',
                        color: isActive ? 'var(--color-brand-blue)' : 'var(--color-ui-text-soft)',
                        transition: 'all 0.2s',
                        textDecoration: 'none'
                    })}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>settings</span>
                    <span style={{ fontWeight: 500, fontSize: '14px' }}>{t('nav.settings') || 'Ajustes'}</span>
                </NavLink>
                <div
                    onClick={() => { logout(); navigate('/login'); }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: 'var(--color-danger-red)',
                        transition: 'all 0.2s',
                        opacity: 0.8
                    }}
                    className="sidebar-item"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>logout</span>
                    <span style={{ fontWeight: 500, fontSize: '14px' }}>Cerrar Sesión</span>
                </div>
            </div>
        </aside>
    );
};
