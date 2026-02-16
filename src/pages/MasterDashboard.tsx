import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { ServerStatus } from '../components/admin/ServerStatus';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';

export const MasterDashboard: FC = () => {
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
            const response = await fetch('/api/admin.php?action=stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setStatsData({
                churches: data.churches?.toString() || '0',
                members: data.members?.toString() || '0',
                songs: data.songs?.toString() || '0',
                reunions: data.reunions?.toString() || '0'
            });
        } catch (err) {
            console.error('Error fetching admin stats:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const stats = [
        { label: 'Iglesias Totales', value: statsData.churches, icon: 'church', color: '#3B82F6' },
        { label: 'Miembros Globales', value: statsData.members, icon: 'groups', color: '#10B981' },
        { label: 'Canciones en Base', value: statsData.songs, icon: 'library_music', color: '#F59E0B' },
        { label: 'Reuniones Activas', value: statsData.reunions, icon: 'calendar_today', color: '#8B5CF6' }
    ];

    const adminOptions = [
        { id: 'churches', label: 'Gestión de Iglesias', icon: 'corporate_fare', desc: 'Alta, baja y modificación de iglesias' },
        { id: 'users', label: 'Control de Usuarios', icon: 'manage_accounts', desc: 'Asignación de roles y permisos globales' },
        { id: 'songs', label: 'Biblioteca Maestra', icon: 'music_video', desc: 'ABM de canciones del sistema' },
        { id: 'reunions', label: 'Cronogramas Globales', icon: 'event_note', desc: 'Vista de calendarios por iglesia' },
        { id: 'permissions', label: 'Configurar permisos', icon: 'security', desc: 'Gestionar acciones permitidas por rol', action: () => navigate('/admin/permissions') },
        { id: 'settings', label: 'Configuración Sistema', icon: 'settings_suggest', desc: 'Ajustes de interfaz, idioma y herramientas técnicas', action: () => navigate('/settings') }
    ];

    if (isLoading) {
        return (
            <div className="flex-center" style={{ height: '300px', flexDirection: 'column', gap: '8px' }}>
                <div className="spinner" />
                <p className="text-overline" style={{ color: '#6B7280' }}>Cargando Panel Maestro...</p>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '40px' }}>
            <header style={{ marginBottom: '32px' }}>
                <h1 className="text-h1">Panel de Control Master</h1>
                <p className="text-body" style={{ color: '#9CA3AF' }}>Administración total de la plataforma multi-iglesia.</p>
            </header>

            <ServerStatus />

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                marginBottom: '40px'
            }}>
                {stats.map(stat => (
                    <Card key={stat.label} style={{ padding: '24px', textAlign: 'center' }}>
                        <span className="material-symbols-outlined" style={{ color: stat.color, fontSize: '32px', marginBottom: '12px' }}>
                            {stat.icon}
                        </span>
                        <h4 className="text-h1" style={{ margin: '0' }}>{stat.value}</h4>
                        <p className="text-overline" style={{ color: '#6B7280', marginTop: '4px' }}>{stat.label}</p>
                    </Card>
                ))}
            </div>

            {/* Quick Actions / Modules */}
            <section style={{ marginBottom: '32px' }}>
                <h2 className="text-h2" style={{ marginBottom: '20px' }}>Módulos de Administración</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {adminOptions.map(opt => (
                        <Card
                            key={opt.id}
                            onClick={opt.action ? opt.action : undefined}
                            style={{
                                padding: '16px 20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '52px',
                                    height: '52px',
                                    borderRadius: '16px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--color-brand-blue)'
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{opt.icon}</span>
                                </div>
                                <div>
                                    <p className="text-card-title" style={{ fontSize: '16px', marginBottom: '2px' }}>{opt.label}</p>
                                    <p className="text-overline" style={{ color: '#6B7280' }}>{opt.desc}</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined" style={{ color: '#4B5563' }}>chevron_right</span>
                        </Card>
                    ))}
                </div>
            </section>

            <ActivityFeed />
        </div>
    );
};
