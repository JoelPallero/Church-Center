import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';

export const PastorDashboard: FC = () => {
    const { t } = useTranslation();
    const { church } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPastorData();
    }, [church?.id]);

    const fetchPastorData = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const churchId = church?.id;
            const url = churchId
                ? `/api/reports?action=pastor_stats&church_id=${churchId}`
                : '/api/reports?action=pastor_stats';

            const response = await fetch(url, {
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
                <p className="text-overline" style={{ color: '#6B7280' }}>{t('pastor.loading')}</p>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '40px' }}>
            <header style={{ marginBottom: '32px' }}>
                <h1 className="text-h1">{t('pastor.title')}</h1>
                <p className="text-body" style={{ color: '#9CA3AF' }}>{t('pastor.subtitle')}</p>
            </header>

            {/* Quick Stats Grid */}
            {/* Quick Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                <Card style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-4px', top: '-4px', opacity: 0.1, pointerEvents: 'none' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--color-brand-blue)' }}>groups</span>
                    </div>
                    <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)', marginBottom: '8px' }}>{t('pastor.stats.activeTeam') || 'Equipo Activo'}</p>
                    <h3 className="text-h1" style={{ fontSize: '32px', marginBottom: '4px' }}>{stats?.active_members || 0}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '12px', fontWeight: 600 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>trending_up</span>
                        <span>+12% vs mes ant.</span>
                    </div>
                </Card>

                <Card style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-4px', top: '-4px', opacity: 0.1, pointerEvents: 'none' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#8B5CF6' }}>event_available</span>
                    </div>
                    <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)', marginBottom: '8px' }}>{t('pastor.stats.monthlyMeetings') || 'Ensayos / Reuniones'}</p>
                    <h3 className="text-h1" style={{ fontSize: '32px', marginBottom: '4px' }}>{stats?.meetings_count || 0}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-ui-text-soft)', fontSize: '12px' }}>
                        <span>Próximo: Mañana 19:00</span>
                    </div>
                </Card>

                <Card style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-4px', top: '-4px', opacity: 0.1, pointerEvents: 'none' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#FFB800' }}>library_music</span>
                    </div>
                    <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)', marginBottom: '8px' }}>Canciones en Base</p>
                    <h3 className="text-h1" style={{ fontSize: '32px', marginBottom: '4px' }}>128</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280', fontSize: '12px' }}>
                        <span>8 nuevas este mes</span>
                    </div>
                </Card>

                <Card style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: '-4px', top: '-4px', opacity: 0.1, pointerEvents: 'none' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#10B981' }}>check_circle</span>
                    </div>
                    <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)', marginBottom: '8px' }}>{t('pastor.stats.compliance') || 'Cumplimiento'}</p>
                    <h3 className="text-h1" style={{ fontSize: '32px', marginBottom: '4px' }}>{stats?.compliance || '94%'}</h3>
                    <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '2px', marginTop: '8px' }}>
                        <div style={{ height: '100%', width: stats?.compliance || '94%', backgroundColor: '#10B981', borderRadius: '2px' }}></div>
                    </div>
                </Card>
            </div>


            {/* Detailed sections */}
            {/* Detailed sections */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px'
            }}>
                {/* Column 1: Weekly Progress & Charts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Card style={{ padding: '24px' }}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h2 className="text-card-title">Resumen Semanal</h2>
                                <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>Actividad de los últimos 7 días</p>
                            </div>
                            <Button variant="ghost" icon="more_horiz" style={{ minWidth: 'auto', padding: '8px' }} />
                        </header>

                        {/* Fake Chart Illustration */}
                        <div style={{ height: '200px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                            {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                                <div key={i} style={{ flex: 1, backgroundColor: i === 3 ? 'var(--color-brand-blue)' : 'rgba(59, 130, 246, 0.1)', height: `${h}%`, borderRadius: '4px 4px 0 0', position: 'relative' }}>
                                    <div className="tooltip-mini" style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--color-ui-text)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', opacity: 0, transition: 'opacity 0.2s' }}>{h}%</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => <span key={d} className="text-overline" style={{ color: 'var(--color-ui-text-soft)', width: '24px', textAlign: 'center' }}>{d}</span>)}
                        </div>
                    </Card>

                    <Card style={{ padding: '24px' }}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 className="text-card-title">{t('pastor.tasks.title')}</h2>
                            <Button variant="ghost" icon="add" label="Nueva" style={{ fontSize: '12px' }} />
                        </header>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {stats?.tasks?.map((task: any, idx: number) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', backgroundColor: 'var(--color-ui-surface)', borderRadius: '12px' }}>
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '6px',
                                        border: '2px solid',
                                        borderColor: task.status === 'done' ? '#10B981' : 'var(--color-border-subtle)',
                                        backgroundColor: task.status === 'done' ? '#10B981' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {task.status === 'done' && <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'white' }}>check</span>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p className="text-body" style={{ fontSize: '14px', fontWeight: 600 }}>{task.title}</p>
                                        <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>
                                            {task.due_date ? `Vence el ${task.due_date}` : 'Sin fecha de vencimiento'}
                                        </p>
                                    </div>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--color-ui-text-soft)', fontSize: '20px' }}>chevron_right</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Column 2: Next Meeting & Team Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Card style={{ padding: '24px' }}>
                        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 className="text-card-title">{t('pastor.nextMeeting.title')}</h2>
                            <span className="text-overline" style={{ color: 'var(--color-brand-blue)', fontWeight: 700 }}>DOM 02/03</span>
                        </header>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {stats?.next_meeting?.songs?.map((song: any, idx: number) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid var(--color-border-subtle)', borderRadius: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        {idx + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p className="text-body" style={{ fontWeight: 600 }}>{song.title}</p>
                                        <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>{song.artist} • Tono: {song.key}</p>
                                    </div>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--color-ui-text-soft)' }}>play_circle</span>
                                </div>
                            ))}
                        </div>
                        <Button variant="primary" label="Ver Cronograma Completo" style={{ marginTop: '24px', width: '100%' }} />
                    </Card>

                    <Card style={{ padding: '24px' }}>
                        <h2 className="text-card-title" style={{ marginBottom: '20px' }}>Estado por Áreas</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {[
                                { name: 'Alabanza', count: 12, growth: '+2', color: '#3B82F6' },
                                { name: 'Sonido', count: 4, growth: '0', color: '#10B981' },
                                { name: 'Ujieres', count: 8, growth: '+1', color: '#F59E0B' },
                                { name: 'Multimedia', count: 3, growth: '-1', color: '#EF4444' }
                            ].map(area => (
                                <div key={area.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: area.color }}></div>
                                            <span className="text-body" style={{ fontWeight: 600 }}>{area.name}</span>
                                        </div>
                                        <span className="text-overline" style={{ fontWeight: 700 }}>{area.count} Miembros</span>
                                    </div>
                                    <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '3px' }}>
                                        <div style={{ height: '100%', width: `${(area.count / 15) * 100}%`, backgroundColor: area.color, borderRadius: '3px' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

        </div>
    );
};



