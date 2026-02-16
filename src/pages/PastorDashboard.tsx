import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const PastorDashboard: FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPastorData();
    }, []);

    const fetchPastorData = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/pastor.php?action=dashboard_stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (err) {
            console.error('Error fetching pastor stats:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-center" style={{ height: '300px', flexDirection: 'column', gap: '8px' }}>
                <div className="spinner" />
                <p className="text-overline" style={{ color: '#6B7280' }}>Cargando Reportes de la Iglesia...</p>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '40px' }}>
            <header style={{ marginBottom: '32px' }}>
                <h1 className="text-h1">Reportes Pastorales</h1>
                <p className="text-body" style={{ color: '#9CA3AF' }}>Vista general del cumplimiento y actividad de los equipos.</p>
            </header>

            {/* Quick Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '8px',
                marginBottom: '32px'
            }}>
                <Card style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span className="material-symbols-outlined" style={{ color: '#10B981' }}>groups</span>
                        <span className="text-overline">EQUIPO ACTIVO</span>
                    </div>
                    <h3 className="text-h1">{stats?.active_members || 0}</h3>
                    <p className="text-overline" style={{ color: '#6B7280' }}>Miembros participando</p>
                </Card>
                <Card style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span className="material-symbols-outlined" style={{ color: '#3B82F6' }}>event_available</span>
                        <span className="text-overline">REUNIONES MES</span>
                    </div>
                    <h3 className="text-h1">{stats?.meetings_count || 0}</h3>
                    <p className="text-overline" style={{ color: '#6B7280' }}>Programadas para este mes</p>
                </Card>
                <Card style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span className="material-symbols-outlined" style={{ color: '#F59E0B' }}>trending_up</span>
                        <span className="text-overline">CUMPLIMIENTO</span>
                    </div>
                    <h3 className="text-h1">{stats?.compliance || '0%'}</h3>
                    <p className="text-overline" style={{ color: '#6B7280' }}>Cumplimiento de tareas</p>
                </Card>
            </div>

            {/* Detailed sections */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                {/* Archived: Estado de Equipos (Not useful for now)
                <Card>
                    <h2 className="text-h2" style={{ marginBottom: '20px' }}>Estado de Equipos</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {stats?.teams?.map((team: any) => (
                            <div key={team.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p className="text-body" style={{ fontWeight: 600, margin: 0 }}>{team.name}</p>
                                    <p className="text-overline" style={{ color: 'gray' }}>{team.member_count} Miembros</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span className={`text-overline status-badge ${team.status === 'ready' ? 'status-active' : 'status-pending'}`}>
                                        {team.status === 'ready' ? 'PROGRAMADO' : 'PENDIENTE'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
                */}

                {/* Task Progress */}
                <Card drop-shadow>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 className="text-card-title">Cumplimiento de Tareas</h2>
                        <span className="text-h2" style={{ color: 'var(--color-brand-blue)' }}>{stats?.compliance}</span>
                    </header>
                    <div style={{ height: '8px', width: '100%', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', marginBottom: '24px' }}>
                        <div style={{ height: '100%', width: stats?.compliance || '0%', backgroundColor: 'var(--color-brand-blue)', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {stats?.tasks?.map((task: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="material-symbols-outlined" style={{
                                    color: task.status === 'done' ? '#10B981' : '#6B7280',
                                    fontSize: '20px'
                                }}>
                                    {task.status === 'done' ? 'check_circle' : 'pending'}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <p className="text-body" style={{ fontSize: '14px', margin: 0 }}>{task.title}</p>
                                    <p className="text-overline" style={{ color: 'gray' }}>
                                        {task.status === 'done' ? 'COMPLETADA' : (task.due_date ? `Vence: ${task.due_date}` : 'Sin fecha')}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {(!stats?.tasks || stats.tasks.length === 0) && (
                            <p className="text-body" style={{ textAlign: 'center', color: 'gray', padding: '12px' }}>
                                No hay tareas pendientes registradas.
                            </p>
                        )}
                    </div>
                </Card>

                {/* Next Meeting Setlist */}
                <Card style={{ gridColumn: 'span 1' }}>
                    <h2 className="text-card-title" style={{ marginBottom: '20px' }}>Próxima Reunión: Setlist</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {stats?.next_meeting?.songs?.map((song: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', backgroundColor: 'var(--color-ui-surface)', borderRadius: '12px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                    {idx + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p className="text-body" style={{ fontWeight: 600, margin: 0 }}>{song.title}</p>
                                    <p className="text-overline" style={{ color: 'gray' }}>{song.artist} | Tono: {song.key}</p>
                                </div>
                            </div>
                        ))}
                        {(!stats?.next_meeting?.songs || stats.next_meeting.songs.length === 0) && (
                            <p className="text-body" style={{ textAlign: 'center', color: '#6B7280' }}>No hay canciones programadas aún.</p>
                        )}
                    </div>
                    <Button variant="secondary" label="Ver Calendario Completo" style={{ marginTop: '20px', width: '100%' }} />
                </Card>
            </div>
        </div>
    );
};
