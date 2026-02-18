import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import '../../index.css';

export const BottomNav: FC = () => {
    useTranslation();
    const { user } = useAuth();

    const isPastor = user?.role?.name === 'pastor';
    const isMaster = user?.role?.name === 'master';
    const isLeader = ['leader', 'coordinator'].includes(user?.role?.name || '');
    const isGuest = user?.role?.level === 200;
    const isMember = user?.role?.name === 'member' || (!isPastor && !isMaster && !isLeader && !isGuest);

    let navItems: any[] = [];

    if (isMaster) {
        // Superadmin: Dashboard, Reportes, Iglesias, Panel de control
        // First item Dashboard -> /
        navItems = [
            { path: '/', icon: 'dashboard', label: 'Dashboard' },
            { path: '/mainhub/reports', icon: 'analytics', label: 'Reportes' },
            { path: '/mainhub/churches', icon: 'church', label: 'Iglesias' },
            { path: '/settings', icon: 'settings_input_component', label: 'Panel' }
        ];
    } else if (isPastor) {
        // Pastor: Reportes, Dashboard, Eventos, Areas, Equipos
        // First item Reportes -> /
        navItems = [
            { path: '/mainhub/reports', icon: 'analytics', label: 'Reportes' },
            { path: '/', icon: 'dashboard', label: 'Dashboard' },
            { path: '/worship/calendar', icon: 'event', label: 'Eventos', isCentral: true },
            { path: '/mainhub/churches', icon: 'location_city', label: 'Areas' },
            { path: '/mainhub/teams', icon: 'groups', label: 'Equipos' }
        ];
    } else if (isLeader) {
        // Líder/coordinador: Inicio, Equipo, Listados, Canciones, Calendario
        // First item Inicio -> /
        navItems = [
            { path: '/', icon: 'home', label: 'Inicio' },
            { path: '/mainhub/teams', icon: 'groups', label: 'Equipo' },
            { path: '/worship/playlists', icon: 'reorder', label: 'Listados', isCentral: true },
            { path: '/worship/songs', icon: 'music_note', label: 'Canciones' },
            { path: '/worship/calendar', icon: 'event', label: 'Calendario' }
        ];
    } else if (isMember) {
        // Miembros: Listados, Canciones, Calendario
        // First item Listados -> /
        navItems = [
            { path: '/worship/playlists', icon: 'reorder', label: 'Listados' },
            { path: '/worship/songs', icon: 'music_note', label: 'Canciones', isCentral: true },
            { path: '/worship/calendar', icon: 'event', label: 'Calendario' }
        ];
    } else if (isGuest) {
        // Invitados: Inicio, Mi Perfil
        // First item Inicio -> /
        navItems = [
            { path: '/', icon: 'home', label: 'Inicio' },
            { path: '/profile', icon: 'person', label: 'Mi Perfil' }
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
