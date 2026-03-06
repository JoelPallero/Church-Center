import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import '../../index.css';

export const BottomNav: FC = () => {
    const { isSuperAdmin, isMaster, hasPermission, user } = useAuth();
    const effectiveIsSuperAdmin = isSuperAdmin || isMaster;

    interface NavItem {
        path: string;
        icon: string;
        label: string;
        permission?: string | null;
        visible?: boolean;
        isCentral?: boolean;
        isDisabled?: boolean;
    }

    // Unified Nav Items logic based on permissions
    const allPossibleItems: NavItem[] = [
        { path: '/dashboard', icon: 'dashboard', label: 'Dashboard', permission: null },
        { path: '/mainhub/churches', icon: 'church', label: 'Iglesias', visible: isSuperAdmin },
        { path: `/mainhub/churches/edit/${user?.churchId}`, icon: 'church', label: 'Mi Iglesia', visible: !isSuperAdmin && !isMaster && !!user?.churchId && hasPermission('church.update') },
        { path: '/mainhub/pastor', icon: 'auto_graph', label: 'Areas', permission: 'church.update' },
        { path: '/mainhub/reports', icon: 'analytics', label: 'Reportes', permission: 'reports.view' },
        { path: '/worship/calendar', icon: 'event', label: 'Calendario', permission: 'calendar.read' },
        { path: '/worship/playlists', icon: 'queue_music', label: 'Listas', permission: 'calendar.read' },
        { path: '/worship/songs', icon: 'library_music', label: 'Canciones', permission: 'song.read' },
        { path: '/mainhub/teams', icon: 'groups', label: 'Equipos', permission: 'team.read' },
        { path: '/mainhub/people', icon: 'person_search', label: 'Personas', permission: 'church.update' },
    ];

    // Filter items based on user permissions
    const filteredNavItems = allPossibleItems.filter(item => {
        if (item.visible !== undefined) return item.visible;
        return !item.permission || hasPermission(item.permission);
    });

    // Limit to 5 items for mobile bottom nav, prioritizing key hubs
    let navItems: NavItem[] = filteredNavItems;

    if (effectiveIsSuperAdmin) {
        navItems = filteredNavItems.filter(i => ['/dashboard', '/mainhub/reports', '/mainhub/churches', '/settings'].includes(i.path));
        // Add settings manually as it might not be in the list
        if (!navItems.find(i => i.path === '/settings')) {
            navItems.push({ path: '/settings', icon: 'settings', label: 'Ajustes', permission: null });
        }
    } else {
        // For others, take the first 5 or relevant ones
        const prioritized = ['/dashboard', '/worship/calendar', '/worship/playlists', '/worship/songs', '/mainhub/teams'];
        navItems = filteredNavItems.filter(i => prioritized.includes(i.path));

        // If still too few, backfill from filteredNavItems
        if (navItems.length < 5) {
            const others = filteredNavItems.filter(i => !prioritized.includes(i.path));
            navItems = [...navItems, ...others].slice(0, 5);
        }

        // Final fallback: Ensure at least Home and Profile
        if (navItems.length === 0) {
            navItems = [
                { path: '/dashboard', icon: 'home', label: 'Dashboard' },
                { path: '/profile', icon: 'person', label: 'Perfil' }
            ];
        }
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
                        to={item.isDisabled || item.path.includes('undefined') ? '#' : item.path}
                        end={item.path === '/dashboard'}
                        className={({ isActive }) => clsx('nav-link', isActive && !item.isDisabled ? 'text-brand-blue' : 'text-gray-500')}
                        onClick={(e) => { if (item.isDisabled || item.path.includes('undefined')) e.preventDefault(); }}
                        style={({ isActive }) => ({
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: (isActive && !item.isDisabled) ? 'var(--color-brand-blue)' : '#9CA3AF',
                            transition: 'all 0.2s ease',
                            flex: 1,
                            position: 'relative',
                            opacity: (item.isDisabled || item.path.includes('undefined')) ? 0.4 : 1,
                            cursor: (item.isDisabled || item.path.includes('undefined')) ? 'default' : 'pointer'
                        })}
                    >
                        {({ isActive }) => (
                            item.isCentral ? (
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    backgroundColor: (item.isDisabled || item.path.includes('undefined')) ? '#4B5563' : 'var(--color-brand-blue)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginTop: '-40px',
                                    boxShadow: (item.isDisabled || item.path.includes('undefined')) ? 'none' : '0 8px 16px rgba(61, 104, 223, 0.4)',
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
                                        fontVariationSettings: (isActive && !item.isDisabled && !item.path.includes('undefined')) ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400",
                                        fontSize: '28px',
                                        marginBottom: '4px'
                                    }}>
                                        {item.icon}
                                    </span>
                                    {item.label && (
                                        <span className="text-overline" style={{ fontSize: '10px', fontWeight: (isActive && !item.isDisabled && !item.path.includes('undefined')) ? 700 : 500 }}>
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
