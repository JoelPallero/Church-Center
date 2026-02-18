import { useState, type FC } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { NotificationCenter } from '../ui/NotificationCenter';
import { DevRoleSwitcher } from '../dev/DevRoleSwitcher';

export const MainLayout: FC = () => {
    const { t } = useTranslation();
    const { logout, user, hasPermission } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const isAnyMenuOpen = userMenuOpen || notificationsOpen;


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getHubTitle = () => {
        // Admins and Pastors always see the main brand
        if (user?.role?.name === 'master' || user?.role?.name === 'pastor') {
            return t('common.churchCenter');
        }

        // Contextual hubs for regular members / leaders
        if (location.pathname.startsWith('/worship')) {
            return t('common.ministryHub');
        }
        if (location.pathname.startsWith('/social')) {
            return t('common.smHub');
        }
        if (location.pathname.startsWith('/mainhub')) {
            return t('common.churchCenter');
        }

        return t('common.churchCenter');
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--color-ui-bg)',
            color: 'var(--color-ui-text)',
            position: 'relative'
        }}>
            {/* Header */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: isAnyMenuOpen ? 2002 : 50, // Above backdrop when open
                backdropFilter: isAnyMenuOpen ? 'blur(20px) saturate(180%) blur(4px)' : 'blur(20px) saturate(180%)',
                backgroundColor: 'var(--color-glass-surface)',
                borderBottom: '1px solid var(--color-border-subtle)',
                transition: 'filter 0.2s, z-index 0s step-start'
            }}>
                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    padding: '16px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-accent-text)' }}>church</span>
                        <span className="text-h2" style={{ color: 'var(--color-accent-text)' }}>{getHubTitle()}</span>
                    </div>
                    <div className="flex-center" style={{ gap: '8px' }}>
                        <NotificationCenter
                            isOpen={notificationsOpen}
                            onOpenChange={(open) => {
                                if (open) setUserMenuOpen(false); // Exclusive open
                                setNotificationsOpen(open);
                            }}
                        />
                        <div style={{ position: 'relative', zIndex: notificationsOpen ? 0 : 70 }}>
                            <span
                                className="material-symbols-outlined"
                                style={{ color: 'var(--color-ui-text)', cursor: 'pointer' }}
                                onClick={() => {
                                    setNotificationsOpen(false); // Close other menu
                                    setUserMenuOpen(!userMenuOpen);
                                }}
                            >
                                more_vert
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {isAnyMenuOpen && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 2000,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(4px)',
                            WebkitBackdropFilter: 'blur(4px)',
                            animation: 'fadeIn 0.2s ease-out'
                        }}
                        onClick={() => {
                            setUserMenuOpen(false);
                            setNotificationsOpen(false);
                        }}
                    />
                    {userMenuOpen && (
                        <div className="dropdown-menu" style={{
                            position: 'fixed',
                            zIndex: 2100,
                            top: '80px',
                            right: 'max(24px, calc((100% - 800px) / 2 + 24px))',
                            width: '260px'
                        }}>
                            {(() => {
                                const isPastor = user?.role?.name === 'pastor';
                                const isMaster = user?.role?.name === 'master';
                                const isLeader = ['leader', 'coordinator'].includes(user?.role?.name || '');
                                const isGuest = user?.role?.level === 200;

                                // Determine Footer Items (matching BottomNav exactly)
                                let footerPaths: string[] = [];
                                if (isMaster) {
                                    footerPaths = ['/', '/reports', '/churches', '/settings'];
                                } else if (isPastor) {
                                    footerPaths = ['/', '/dashboard_view', '/reunions', '/churches', '/teams'];
                                } else if (isLeader) {
                                    footerPaths = ['/', '/teams', '/playlists', '/songs', '/reunions'];
                                } else if (isGuest) {
                                    footerPaths = ['/', '/profile'];
                                } else { // Member
                                    footerPaths = ['/', '/songs', '/reunions'];
                                }

                                // List of all possible navigatable items with required permissions
                                const navItemsMetadata = [
                                    { path: '/', icon: 'dashboard', label: t('nav.home'), permission: null },
                                    { path: '/worship/songs', icon: 'music_note', label: t('nav.songs'), permission: 'songs.view' },
                                    { path: '/mainhub/churches', icon: 'church', label: isPastor ? t('nav.areas') : t('nav.churches'), permission: 'churches.view' },
                                    { path: '/worship/calendar', icon: 'event', label: t('nav.calendar'), permission: 'reunions.view' },
                                    { path: '/mainhub/teams', icon: 'groups', label: t('nav.teams'), permission: 'teams.view' },
                                    { path: '/mainhub/people', icon: 'person_search', label: t('nav.people'), permission: 'users.view' },
                                    { path: '/mainhub/reports', icon: 'analytics', label: t('nav.reports'), permission: 'reports.view' },
                                    { path: '/worship/playlists', icon: 'reorder', label: t('nav.playlists'), permission: 'songs.view' },
                                    { path: '/settings', icon: 'settings', label: t('nav.settings'), permission: null }
                                ];

                                // Filter items: (Has permission OR no permission required) AND Not in footer
                                const uniqueItems = navItemsMetadata.filter(item => {
                                    const hasPerm = !item.permission || hasPermission(item.permission);
                                    const inFooter = footerPaths.includes(item.path);
                                    return hasPerm && !inFooter;
                                });

                                return (
                                    <>
                                        {/* Perfil (Always at top) */}
                                        <div onClick={() => { navigate('/profile'); setUserMenuOpen(false); }} className="dropdown-item">
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person</span>
                                            <span>{t('profile.me') || 'Mi Perfil'}</span>
                                        </div>

                                        {/* Unique Role Items */}
                                        {uniqueItems.map(item => (
                                            <div key={item.path} onClick={() => { navigate(item.path); setUserMenuOpen(false); }} className="dropdown-item">
                                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
                                                <span>{item.label}</span>
                                            </div>
                                        ))}

                                        <div className="dropdown-divider" />

                                        {/* Privacy and Support (Always at bottom) */}
                                        <div onClick={() => { navigate('/privacy'); setUserMenuOpen(false); }} className="dropdown-item">
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
                                            <span>{t('nav.privacy') || 'Privacidad y Soporte'}</span>
                                        </div>
                                    </>
                                );
                            })()}
                            <div className="dropdown-divider" />
                            <div
                                onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                                className="dropdown-item"
                                style={{ color: '#FF4B4B' }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                                <span style={{ fontWeight: 'bold' }}>{t('profile.logout') || 'Cerrar Sesión'}</span>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Main Content */}
            <main style={{
                padding: '16px',
                paddingBottom: '120px',
                maxWidth: '800px',
                margin: '0 auto',
                filter: isAnyMenuOpen ? 'blur(2px)' : 'none',
                transition: 'filter 0.2s'
            }}>
                <Outlet />
            </main>

            {/* Navigation */}
            <BottomNav />

            {/* Dev Tools */}
            <DevRoleSwitcher />
        </div>
    );
};
