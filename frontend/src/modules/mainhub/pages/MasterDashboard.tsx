import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { ServerStatus } from '../../../components/admin/ServerStatus';
import { ActivityFeed } from '../../../components/dashboard/ActivityFeed';

export const MasterDashboard: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [statsData, setStatsData] = useState({
        churches: '0',
        members: '0',
        songs: '0',
        reunions: '0'
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/reports', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            const stats = data.data || {};
            setStatsData({
                churches: (stats.churches ?? 0).toString(),
                members: (stats.members ?? 0).toString(),
                songs: (stats.songs ?? 0).toString(),
                reunions: (stats.reunions ?? 0).toString()
            });
        } catch (err) {
            console.error('Error fetching admin stats:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const stats = [
        { label: t('dashboard.stats.totalChurches') || 'Iglesias Totales', value: statsData.churches, icon: 'church', color: '#3B82F6' },
        { label: t('dashboard.stats.globalMembers') || 'Miembros Globales', value: statsData.members, icon: 'groups', color: '#10B981' },
        { label: t('dashboard.stats.songsInBase') || 'Canciones en Base', value: statsData.songs, icon: 'library_music', color: '#F59E0B' },
        { label: t('dashboard.stats.activeMeetings') || 'Reuniones Activas', value: statsData.reunions, icon: 'calendar_today', color: '#8B5CF6' }
    ];

    const adminOptions = [
        { id: 'churches', label: t('dashboard.admin.churchManagement') || 'Gestión de Iglesias', icon: 'corporate_fare', desc: t('dashboard.admin.churchManagementDesc') || 'Alta, baja y modificación de iglesias', action: () => navigate('/mainhub/churches') },
        { id: 'users', label: t('dashboard.admin.userControl') || 'Control de Usuarios', icon: 'manage_accounts', desc: t('dashboard.admin.userControlDesc') || 'Asignación de roles y permisos globales', action: () => navigate('/mainhub/people') },
        { id: 'songs', label: t('dashboard.admin.masterLibrary') || 'Biblioteca Maestra', icon: 'music_video', desc: t('dashboard.admin.masterLibraryDesc') || 'ABM de canciones del sistema', action: () => navigate('/worship/songs') },
        { id: 'reunions', label: t('dashboard.admin.globalSchedules') || 'Cronogramas Globales', icon: 'event_note', desc: t('dashboard.admin.globalSchedulesDesc') || 'Vista de calendarios por iglesia', action: () => navigate('/worship/calendar') },
        { id: 'permissions', label: t('dashboard.admin.configurePermissions') || 'Configurar permisos', icon: 'security', desc: t('dashboard.admin.configurePermissionsDesc') || 'Gestionar acciones permitidas por rol', action: () => navigate('/admin/permissions') },
        { id: 'settings', label: t('dashboard.admin.systemSettings') || 'Configuración Sistema', icon: 'settings_suggest', desc: t('dashboard.admin.systemSettingsDesc') || 'Ajustes de interfaz, idioma y herramientas técnicas', action: () => navigate('/settings') }
    ];

    if (isLoading) {
        return (
            <div className="flex-center" style={{ height: '300px', flexDirection: 'column', gap: '8px' }}>
                <div className="spinner" />
                <p className="text-overline" style={{ color: '#6B7280' }}>{t('dashboard.admin.loading') || 'Cargando Panel Maestro...'}</p>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '40px' }}>
            <header style={{ marginBottom: '32px' }}>
                <h1 className="text-h1">{t('dashboard.admin.title') || 'Panel de Control Master'}</h1>
                <p className="text-body" style={{ color: '#9CA3AF' }}>{t('dashboard.admin.subtitle') || 'Administración total de la plataforma multi-iglesia.'}</p>
            </header>

            <ServerStatus />

            {/* Stats Grid */}
            <div className="dashboard-stats-grid">
                {stats.map(stat => (
                    <Card key={stat.label} className="stat-card" style={{ textAlign: 'center' }}>
                        <span className="material-symbols-outlined" style={{ color: stat.color, fontSize: '32px', marginBottom: '12px' }}>
                            {stat.icon}
                        </span>
                        <h4 className="text-h1" style={{ margin: '0', fontSize: 'inherit' }}>{stat.value}</h4>
                        <p className="text-overline" style={{ color: '#6B7280', marginTop: '4px' }}>{stat.label}</p>
                    </Card>
                ))}
            </div>

            {/* Quick Actions / Modules */}
            <section style={{ marginBottom: '40px' }}>
                <h2 className="text-overline" style={{ color: 'var(--color-brand-blue)', marginBottom: '24px', letterSpacing: '1px', fontWeight: 700 }}>{t('dashboard.admin.modules') || 'Módulos de Administración'}</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '16px'
                }}>
                    {adminOptions.map(opt => (
                        <Card
                            key={opt.id}
                            onClick={opt.action ? opt.action : undefined}
                            style={{
                                padding: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative'
                            }}
                            className="sidebar-item"
                        >
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: 'var(--color-brand-blue)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(59, 130, 246, 0.1)'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>{opt.icon}</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <h3 className="text-card-title" style={{ fontSize: '18px' }}>{opt.label}</h3>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--color-ui-text-soft)', fontSize: '20px' }}>arrow_forward</span>
                                </div>
                                <p className="text-body-secondary" style={{ fontSize: '13px', lineHeight: '1.4' }}>{opt.desc}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                <ActivityFeed />
                {/* Potential room for more admin-specific widgets here */}
            </div>

        </div>
    );
};



