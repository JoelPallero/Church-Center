import { useState, type FC } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { NotificationCenter } from '../ui/NotificationCenter';
import { DevRoleSwitcher } from '../dev/DevRoleSwitcher';

export const MainLayout: FC = () => {
    const { t } = useTranslation();
    const { logout, user, hasPermission } = useAuth();
    const navigate = useNavigate();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const isAnyMenuOpen = userMenuOpen || notificationsOpen;


    const handleLogout = () => {
        logout();
        navigate('/login');
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
                filter: isAnyMenuOpen && !notificationsOpen ? 'blur(4px)' : 'none',
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
                        <span className="text-h2" style={{ color: 'var(--color-accent-text)' }}>{t('auth.signInTitle', { church: t('common.church') })}</span>
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
                        <div className="dropdown-menu" style={{ top: '80px', right: 'max(24px, calc((100% - 800px) / 2 + 24px))', width: '260px' }}>
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
                                    { path: '/', icon: 'dashboard', label: 'Inicio', permission: null },
                                    { path: '/songs', icon: 'music_note', label: 'Canciones', permission: 'songs.view' },
                                    { path: '/churches', icon: 'church', label: isPastor ? 'Areas' : 'Iglesias', permission: 'churches.view' },
                                    { path: '/reunions', icon: 'event', label: 'Calendario', permission: 'reunions.view' },
                                    { path: '/teams', icon: 'groups', label: 'Equipos', permission: 'teams.view' },
                                    { path: '/people', icon: 'person_search', label: 'Personas', permission: 'users.view' },
                                    { path: '/reports', icon: 'analytics', label: 'Reportes', permission: 'reports.view' },
                                    { path: '/playlists', icon: 'reorder', label: 'Listados', permission: 'songs.view' },
                                    { path: '/settings', icon: 'settings', label: 'Preferencias', permission: null }
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
                                            <span>Mi Perfil</span>
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
                                            <span>Privacidad y Soporte</span>
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
                                <span style={{ fontWeight: 'bold' }}>Cerrar Sesión</span>
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
