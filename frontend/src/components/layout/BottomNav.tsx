import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import '../../index.css';

export const BottomNav: FC = () => {
    const { t } = useTranslation();
    const { isSuperAdmin, isMaster, hasPermission } = useAuth();
    const effectiveIsSuperAdmin = isSuperAdmin || isMaster;

    const isPastor = hasPermission('church.update');
    const isLeader = hasPermission('team.create') || hasPermission('area.create');
    const isMember = hasPermission('church.read') && !isPastor && !isLeader;
    const isGuest = !hasPermission('church.read') && !effectiveIsSuperAdmin;

    let navItems: any[] = [];

    if (effectiveIsSuperAdmin) {
        // Superadmin: Dashboard, Reportes, Iglesias, Panel de control
        navItems = [
            { path: '/', icon: 'dashboard', label: t('nav.dashboard') },
            { path: '/mainhub/reports', icon: 'analytics', label: t('nav.reports') },
            { path: '/mainhub/churches', icon: 'church', label: t('nav.churches') },
            { path: '/settings', icon: 'settings_input_component', label: t('nav.settings') }
        ];
    } else if (isPastor) {
        // Pastor: Reportes, Dashboard, Eventos, Areas, Equipos
        navItems = [
            { path: '/mainhub/ushers', icon: 'how_to_reg', label: t('nav.ushers') },
            { path: '/mainhub/reports', icon: 'analytics', label: t('nav.reports') },
            { path: '/', icon: 'dashboard', label: t('nav.dashboard') },
            { path: '/worship/calendar', icon: 'event', label: t('nav.calendar'), isCentral: true },
            { path: '/mainhub/teams', icon: 'groups', label: t('nav.teams') }
        ];
    } else if (isLeader) {
        // Líder/coordinador: Inicio, Equipo, Listados, Canciones, Calendario
        navItems = [
            { path: '/', icon: 'home', label: t('nav.home') },
            { path: '/mainhub/teams', icon: 'groups', label: t('nav.teams') },
            { path: '/worship/playlists', icon: 'reorder', label: t('nav.playlists'), isCentral: true },
            { path: '/worship/songs', icon: 'music_note', label: t('nav.songs') },
            { path: '/worship/calendar', icon: 'event', label: t('nav.calendar') }
        ];
    } else if (isMember) {
        // Miembros: Listados, Canciones, Calendario
        navItems = [
            { path: '/worship/playlists', icon: 'reorder', label: t('nav.playlists') },
            { path: '/worship/songs', icon: 'music_note', label: t('nav.songs'), isCentral: true },
            { path: '/worship/calendar', icon: 'event', label: t('nav.calendar') }
        ];
    } else if (isGuest) {
        // Invitados: Inicio, Mi Perfil
        navItems = [
            { path: '/', icon: 'home', label: t('nav.home') },
            { path: '/profile', icon: 'person', label: t('nav.me') }
        ];
    }

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: 'var(--color-glass-surface)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderTop: '1px solid var(--color-border-subtle)',
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: navItems.length > 2 ? 'space-between' : 'space-around',
                alignItems: 'center',
                height: '80px',
                padding: '0 10px',
                paddingBottom: 'env(safe-area-inset-bottom, 16px)'
            }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) => clsx('nav-link', isActive ? 'text-brand-blue' : 'text-gray-500')}
                        style={({ isActive }) => ({
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: isActive ? 'var(--color-brand-blue)' : '#9CA3AF',
                            transition: 'all 0.2s ease',
                            flex: 1,
                            position: 'relative'
                        })}
                    >
                        {({ isActive }) => (
                            item.isCentral ? (
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--color-brand-blue)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: '-40px',
                                    boxShadow: '0 8px 16px rgba(61, 104, 223, 0.4)',
                                    border: '4px solid var(--color-ui-bg)',
                                    color: 'white'
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '32px', fontVariationSettings: "'FILL' 1" }}>
                                        {item.icon}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined" style={{
                                        fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400",
                                        fontSize: '28px',
                                        marginBottom: '4px'
                                    }}>
                                        {item.icon}
                                    </span>
                                    {item.label && (
                                        <span className="text-overline" style={{ fontSize: '10px', fontWeight: isActive ? 700 : 500 }}>
                                            {item.label}
                                        </span>
                                    )}
                                </>
                            )
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};
