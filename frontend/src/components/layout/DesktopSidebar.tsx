import { type FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

export const DesktopSidebar: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission, logout } = useAuth();

    const menuItems = [
        { path: '/dashboard', icon: 'dashboard', label: t('nav.home'), permission: null },
        { path: '/mainhub/churches', icon: 'church', label: t('nav.churches'), permission: 'church.update' },
        { path: '/mainhub/reports', icon: 'auto_graph', label: 'Estadísticas', permission: 'reports.view' },
        { path: '/worship/calendar', icon: 'event', label: t('nav.calendar'), permission: 'calendar.read' },
        { path: '/worship/playlists', icon: 'queue_music', label: t('nav.playlists'), permission: 'calendar.read' },
        { path: '/worship/songs', icon: 'library_music', label: t('nav.songs'), permission: 'song.read' },
        { path: '/mainhub/areas', icon: 'layers', label: t('nav.areas'), permission: 'church.update' },
        { path: '/mainhub/teams', icon: 'groups', label: t('nav.teams'), permission: 'team.read' },
        { path: '/mainhub/people', icon: 'person_search', label: t('nav.people'), permission: 'church.update' },
    ];

    const bottomItems = [
        { path: '/settings', icon: 'settings', label: t('nav.settings') || 'Panel de Control' }
    ];

    const visibleItems = menuItems.filter(item => !item.permission || hasPermission(item.permission));

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
                    <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--color-brand-blue)' }}>Church Center</span>
                </div>

                <nav style={{ padding: '12px', overflowY: 'auto' }}>
                    {visibleItems.map(item => {
                        const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                        return (
                            <div
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    marginBottom: '4px',
                                    backgroundColor: isActive ? 'rgba(63, 108, 222, 0.1)' : 'transparent',
                                    color: isActive ? 'var(--color-brand-blue)' : 'var(--color-ui-text-soft)',
                                    transition: 'all 0.2s'
                                }}
                                className="sidebar-item"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                                <span style={{ fontWeight: isActive ? 600 : 500, fontSize: '14px' }}>{item.label}</span>
                            </div>
                        );
                    })}
                </nav>
            </div>

            <div style={{ padding: '12px', borderTop: '1px solid var(--color-border-subtle)', marginTop: 'auto' }}>
                {bottomItems.map(item => (
                    <div
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 16px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            marginBottom: '4px',
                            color: 'var(--color-ui-text-soft)',
                            transition: 'all 0.2s'
                        }}
                        className="sidebar-item"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{item.icon}</span>
                        <span style={{ fontWeight: 500, fontSize: '14px' }}>{item.label}</span>
                    </div>
                ))}
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
