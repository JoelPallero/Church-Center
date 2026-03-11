import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import '../../index.css';

export const BottomNav: FC = () => {
    const { t } = useTranslation();
    const { canAccess, isSuperAdmin, hasRole } = useAuth();
    const isPastor = hasRole('pastor');
    const isLeader = hasRole('leader') || hasRole('coordinator');
    const isMember = hasRole('member');

    interface NavItem {
        path: string;
        icon: string;
        label: string;
    }

    // Comprehensive list of paths as defined in the CSV matrix
    const allItems: NavItem[] = [
        { path: '/dashboard', icon: 'dashboard', label: (isPastor || isSuperAdmin) ? 'Dashboard' : t('nav.dashboard') },
        { path: '/mainhub/reports', icon: 'analytics', label: (isPastor || isSuperAdmin) ? 'Reportes' : t('nav.reports') },
        { path: '/mainhub/churches', icon: 'church', label: isSuperAdmin ? 'Iglesias' : 'Mi Iglesia' },
        { path: '/mainhub/areas', icon: 'layers', label: isPastor ? 'Areas' : t('nav.areas') },
        { path: '/settings', icon: 'settings', label: 'Ajustes' },
        { path: '/mainhub/my-team', icon: 'diversity_3', label: 'Mi Equipo' },
        { path: '/worship/calendar', icon: 'event', label: isSuperAdmin ? 'Calendarios' : (isPastor ? 'Calendario' : t('nav.calendar')) },
        { path: '/worship/playlists', icon: 'queue_music', label: (isPastor || isLeader || isMember) ? 'Listados' : t('nav.playlists') },
        { path: '/worship/songs', icon: 'library_music', label: (isPastor || isSuperAdmin) ? 'Biblioteca' : (isLeader ? 'Canciones' : t('nav.songs')) },
        { path: '/mainhub/teams', icon: 'groups', label: isPastor ? 'Equipos' : t('nav.teams') },
        { path: '/mainhub/people', icon: 'person_search', label: (isPastor || isSuperAdmin) ? 'Personas' : t('nav.people') },
        { path: '/mainhub/consolidation', icon: 'how_to_reg', label: t('nav.consolidation') },
    ];

    let navItems: NavItem[] = [];

    if (isSuperAdmin) {
        // Specific footer for Superadmin
        const superadminFooterPaths = ['/dashboard', '/mainhub/reports', '/mainhub/churches', '/settings'];
        navItems = allItems.filter(item => superadminFooterPaths.includes(item.path));
    } else if (isPastor) {
        // Specific footer for Pastor
        const pastorFooterPaths = ['/dashboard', '/mainhub/reports', '/mainhub/churches', '/mainhub/areas', '/settings'];
        navItems = allItems.filter(item => pastorFooterPaths.includes(item.path));
    } else if (isLeader || isMember) {
        // Specific footer for Leader and Member
        const leaderFooterPaths = ['/worship/calendar', '/mainhub/my-team', '/worship/playlists', '/worship/songs', '/settings'];
        navItems = leaderFooterPaths
            .map(path => allItems.find(item => item.path === path))
            .filter((item): item is NavItem => !!item);
    } else {
        // Filter by permissions matrix for other roles
        const filteredItems = allItems.filter(item => canAccess(item.path));
        // Take up to 5 items
        navItems = filteredItems.slice(0, 5);
    }

    // If no items (very rare), fallback to profile
    if (navItems.length === 0) {
        navItems.push({ path: '/profile', icon: 'person', label: 'Perfil' });
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
                        end={item.path === '/dashboard'}
                        className={({ isActive }) => clsx('nav-link', isActive ? 'text-brand-blue' : 'text-gray-500')}
                        style={({ isActive }) => ({
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: isActive ? 'var(--color-brand-blue)' : '#9CA3AF',
                            transition: 'all 0.2s ease',
                            flex: 1,
                            position: 'relative',
                            cursor: 'pointer'
                        })}
                    >
                        {({ isActive }) => (
                            <>
                                <span className="material-symbols-outlined" style={{
                                    fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400",
                                    fontSize: '28px',
                                    marginBottom: '4px'
                                }}>
                                    {item.icon}
                                </span>
                                {item.label && (
                                    <span className="text-overline" style={{
                                        fontSize: '10px',
                                        fontWeight: isActive ? 700 : 500,
                                        textAlign: 'center'
                                    }}>
                                        {item.label}
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};
