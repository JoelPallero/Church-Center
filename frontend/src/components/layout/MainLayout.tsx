import { useState, type FC } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../hooks/useAuth';
import { NotificationCenter } from '../ui/NotificationCenter';
import Chatbot from '../chatbot/Chatbot';
import { ToastContainer } from '../ui/Toast';
import { DesktopSidebar } from './DesktopSidebar';

export const MainLayout: FC = () => {
    const { t } = useTranslation();
    const { logout, user, hasPermission, isSuperAdmin, isMaster, canAccess, hasRole, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isPastor = hasRole('pastor');
    const isLeader = hasRole('leader') || hasRole('coordinator');
    const isMember = hasRole('member');
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const isAnyMenuOpen = userMenuOpen || notificationsOpen;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getHubTitle = () => {
        if (!user) return "";

        // Members see their name and role
        if (!hasPermission('church.update') && !isSuperAdmin) {
            const roleName = user.role?.displayName || user.role?.name || "";
            return `${user.name} / ${roleName}`;
        }

        if (isSuperAdmin || isMaster) {
            return t('people.roles.master') || "Super Administrador";
        }

        if (location.pathname.startsWith('/worship')) {
            return t('common.ministryHub');
        }
        if (location.pathname.startsWith('/social')) {
            return t('common.socialMediaHub');
        }
        if (location.pathname.startsWith('/sound')) {
            return t('common.soundHub');
        }
        if (location.pathname.startsWith('/multimedia')) {
            return t('common.multimediaHub');
        }
        if (location.pathname.startsWith('/mainhub/pastor')) {
            return t('common.pastoralHub');
        }
        if (location.pathname.startsWith('/mainhub/consolidation')) {
            return t('consolidation.title');
        }
        if (location.pathname.startsWith('/mainhub/teams')) {
            return t('nav.teams');
        }
        if (location.pathname.startsWith('/mainhub/my-team')) {
            return 'Mi Equipo';
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
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <DesktopSidebar />

            {/* Mobile Header */}
            <header className="mobile-only" style={{
                position: 'sticky',
                top: 0,
                zIndex: isAnyMenuOpen ? 2002 : 50,
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
                        <img src="/favicon.png" alt="Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span className="text-h2" style={{ color: 'var(--color-accent-text)' }}>{getHubTitle()}</span>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: 'var(--color-brand-blue)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                letterSpacing: '0.05em',
                                lineHeight: 1
                            }}>
                                Beta
                            </span>
                        </div>
                    </div>
                    <div className="flex-center" style={{ gap: '12px' }}>
                        <NotificationCenter
                            isOpen={notificationsOpen}
                            onOpenChange={(open) => {
                                if (open) setUserMenuOpen(false);
                                setNotificationsOpen(open);
                            }}
                        />
                        <div
                            style={{
                                position: 'relative',
                                zIndex: notificationsOpen ? 0 : 70,
                                cursor: 'pointer'
                            }}
                            onClick={() => {
                                setNotificationsOpen(false);
                                setUserMenuOpen(!userMenuOpen);
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: userMenuOpen ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-ui-surface)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--color-ui-text-soft)',
                                border: '1px solid var(--color-border-subtle)',
                                transition: 'all 0.2s'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile-Only Dropdown & Overlay */}
            <div className="mobile-only">
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
                                WebkitBackdropFilter: 'blur(4px)'
                            }}
                            onClick={() => {
                                setUserMenuOpen(false);
                                setNotificationsOpen(false);
                            }}
                        />
                        {userMenuOpen && (
                            <div className="dropdown-menu" style={{
                                position: 'fixed',
                                zIndex: 2101,
                                top: '70px',
                                right: '16px',
                                width: '240px'
                            }}>
                                <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                                    <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>{user?.name}</p>
                                    <p style={{ fontSize: '11px', color: 'var(--color-ui-text-soft)', textTransform: 'uppercase', fontWeight: 600 }}>
                                        {user?.role?.displayName || user?.role?.name || 'Miembro'}
                                    </p>
                                </div>
                                 <div onClick={() => { navigate('/profile'); setUserMenuOpen(false); }} className="dropdown-item">
                                     <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person</span>
                                     <span>Mi perfil</span>
                                 </div>
                                 {canAccess('action.chatbot') && (
                                     <div onClick={() => { 
                                         setUserMenuOpen(false);
                                         window.dispatchEvent(new CustomEvent('open-chatbot'));
                                     }} className="dropdown-item" style={{ color: 'var(--color-brand-blue)' }}>
                                         <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>smart_toy</span>
                                         <span style={{ fontWeight: 600 }}>Asistente IA</span>
                                     </div>
                                 )}
                                 {hasPermission('church.update_own') && user?.churchId && !hasPermission('church.update') && (
                                    <div onClick={() => { navigate(`/mainhub/churches/edit/${user?.churchId}`); setUserMenuOpen(false); }} className="dropdown-item">
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>church</span>
                                        <span>Mi Iglesia</span>
                                    </div>
                                )}
                                <div onClick={() => { navigate('/worship/instruments'); setUserMenuOpen(false); }} className="dropdown-item">
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>piano</span>
                                    <span>Mis Instrumentos</span>
                                </div>
                                <div onClick={() => { navigate('/settings'); setUserMenuOpen(false); }} className="dropdown-item">
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings</span>
                                    <span>Configuraciones</span>
                                 </div>
                                 <div className="dropdown-divider" />
                                 <div style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 700, color: 'var(--color-ui-text-soft)', textTransform: 'uppercase' }}>
                                     Navegación
                                 </div>
                                 <div onClick={() => { navigate('/dashboard'); setUserMenuOpen(false); }} className="dropdown-item">
                                     <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dashboard</span>
                                     <span>{t('nav.home')}</span>
                                 </div>
                                 {[
                                     { path: '/dashboard', icon: 'dashboard', label: (isPastor || isSuperAdmin) ? 'Dashboard' : t('nav.home') },
                                     { path: '/mainhub/reports', icon: 'auto_graph', label: (isPastor || isSuperAdmin) ? 'Reportes' : 'Estadísticas' },
                                     { 
                                         path: isSuperAdmin ? '/mainhub/churches' : (user?.churchId ? `/mainhub/churches/edit/${user.churchId}` : '/mainhub/churches'), 
                                         icon: 'church', 
                                         label: isSuperAdmin ? 'Iglesias' : 'Mi Iglesia' 
                                     },
                                     { path: '/mainhub/areas', icon: 'layers', label: isPastor ? 'Areas' : t('nav.areas') },
                                     { path: '/worship/calendar', icon: 'event', label: isPastor ? 'Calendario' : t('nav.calendar') },
                                     { path: '/worship/playlists', icon: 'queue_music', label: (isPastor || isLeader || isMember) ? 'Listados' : t('nav.playlists') },
                                     { path: '/worship/songs', icon: 'library_music', label: (isPastor || isSuperAdmin || isLeader || isMember) ? 'Biblioteca' : (isLeader ? 'Canciones' : t('nav.songs')) },
                                     { path: '/mainhub/teams', icon: 'groups', label: (isPastor || isLeader) ? 'Equipos' : t('nav.teams') },
                                     { path: '/mainhub/people', icon: 'person_search', label: (isPastor || isSuperAdmin) ? 'Personas' : t('nav.people') },
                                     { path: '/mainhub/my-team', icon: 'diversity_3', label: 'Mi Equipo' },
                                     { path: '/mainhub/consolidation', icon: 'how_to_reg', label: t('nav.consolidation') },
                                 ].filter(item => {
                                     if (!canAccess(item.path)) return false;
                                     
                                     // Only show top 5 items in BottomNav, so others should be in dropdown
                                     // But for simplicity and UI consistency, we can show everything in dropdown
                                     // as it's a "Mega Menu" for mobile.
                                     return true;
                                 }).map(item => (
                                     <div key={item.path} onClick={() => { navigate(item.path); setUserMenuOpen(false); }} className="dropdown-item">
                                         <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
                                         <span>{item.label}</span>
                                     </div>
                                 ))}

                                 <div className="dropdown-divider" />
                                 <div onClick={() => { handleLogout(); setUserMenuOpen(false); }} className="dropdown-item" style={{ color: 'var(--color-danger-red)', fontWeight: 600 }}>
                                     <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                                     <span>Cerrar Sesión</span>
                                 </div>
                             </div>
                         )}
                     </>
                 )}
             </div>

            <div style={{
                flex: 1,
                marginLeft: 'var(--main-margin-left, 0)',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                backgroundColor: 'var(--color-ui-bg)'
            }}>
                <main style={{
                    flex: 1,
                    padding: 'var(--main-padding, 24px)',
                    paddingBottom: '120px',
                    filter: (isAnyMenuOpen && !window.matchMedia('(min-width: 1200px)').matches) ? 'blur(2px)' : 'none',
                    transition: 'filter 0.2s'
                }}>
                    {/* Desktop Top Bar */}
                    <div className="desktop-only" style={{ marginBottom: '24px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            paddingBottom: '16px',
                            borderBottom: '1px solid var(--color-border-subtle)',
                            marginBottom: '12px'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ui-text-soft)', fontSize: '12px', marginBottom: '4px' }}>
                                    <span style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>Inicio</span>
                                    {location.pathname.split('/').filter(Boolean).map((part, i, arr) => (
                                        <span key={part} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chevron_right</span>
                                            <span style={{
                                                textTransform: 'capitalize',
                                                fontWeight: i === arr.length - 1 ? 600 : 400,
                                                color: i === arr.length - 1 ? 'var(--color-brand-blue)' : 'inherit'
                                            }}>
                                                {part.replace(/-/g, ' ')}
                                            </span>
                                        </span>
                                    ))}
                                </div>
                                <h1 className="text-h2" style={{ margin: 0 }}>{getHubTitle()}</h1>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <NotificationCenter
                                    isOpen={notificationsOpen}
                                    onOpenChange={setNotificationsOpen}
                                />

                                <div style={{ position: 'relative' }}>
                                    <div
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            cursor: 'pointer',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            backgroundColor: userMenuOpen ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--color-ui-surface)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--color-ui-text-soft)',
                                            border: '1px solid var(--color-border-subtle)'
                                        }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person</span>
                                        </div>
                                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{user?.name}</span>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                            {userMenuOpen ? 'expand_less' : 'expand_more'}
                                        </span>
                                    </div>

                                    {userMenuOpen && (
                                        <div className="dropdown-menu" style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: '8px',
                                            width: '220px',
                                            zIndex: 3000,
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                                        }}>
                                            <div onClick={() => { navigate('/profile'); setUserMenuOpen(false); }} className="dropdown-item">
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                                                <span>Mi perfil</span>
                                            </div>
                                            {canAccess('action.chatbot') && (
                                                <div onClick={() => { 
                                                    setUserMenuOpen(false);
                                                    window.dispatchEvent(new CustomEvent('open-chatbot'));
                                                }} className="dropdown-item" style={{ color: 'var(--color-brand-blue)' }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>smart_toy</span>
                                                    <span style={{ fontWeight: 600 }}>Asistente IA</span>
                                                </div>
                                            )}
                                            {hasPermission('church.update_own') && user?.churchId && !hasPermission('church.update') && (
                                                <div onClick={() => { navigate(`/mainhub/churches/edit/${user?.churchId}`); setUserMenuOpen(false); }} className="dropdown-item">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>church</span>
                                                    <span>Mi Iglesia</span>
                                                </div>
                                            )}
                                            <div onClick={() => { navigate('/worship/instruments'); setUserMenuOpen(false); }} className="dropdown-item">
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>piano</span>
                                                <span>Mis Instrumentos</span>
                                            </div>
                                            <div onClick={() => { navigate('/settings'); setUserMenuOpen(false); }} className="dropdown-item">
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span>
                                                <span>Configuraciones</span>
                                            </div>
                                            <div className="dropdown-divider" />
                                            <div
                                                onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                                                className="dropdown-item"
                                                style={{ color: 'var(--color-danger-red)' }}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                                                <span style={{ fontWeight: 600 }}>Cerrar Sesión</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <Outlet />
                </main>
            </div>

            <div className="mobile-only">
                <BottomNav />
            </div>
            {isAuthenticated && canAccess('action.chatbot') && <Chatbot userName={user?.name ?? "Usuario"} />}
            <ToastContainer />
        </div>
    );
};
