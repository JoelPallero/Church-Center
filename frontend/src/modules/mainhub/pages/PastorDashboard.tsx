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
                <Card style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>{t('pastor.stats.activeTeam') || 'Equipo Activo'}</p>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--color-brand-blue)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>groups</span>
                        </div>
                    </div>
                    <h3 className="text-h1" style={{ fontSize: '32px', marginBottom: '4px' }}>{stats?.active_members || 0}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '12px', fontWeight: 600 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>trending_up</span>
                        <span>+12% vs mes ant.</span>
                    </div>
                </Card>

                <Card style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>{t('pastor.stats.monthlyMeetings') || 'Ensayos / Reuniones'}</p>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            color: '#8B5CF6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>event_available</span>
                        </div>
                    </div>
                    <h3 className="text-h1" style={{ fontSize: '32px', marginBottom: '4px' }}>{stats?.meetings_count || 0}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-ui-text-soft)', fontSize: '12px' }}>
                        <span>Próximo: Mañana 19:00</span>
                    </div>
                </Card>

                <Card style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>Canciones en Base</p>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(255, 184, 0, 0.1)',
                            color: '#FFB800',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>library_music</span>
                        </div>
                    </div>
                    <h3 className="text-h1" style={{ fontSize: '32px', marginBottom: '4px' }}>128</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280', fontSize: '12px' }}>
                        <span>8 nuevas este mes</span>
                    </div>
                </Card>

                <Card style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>{t('pastor.stats.compliance') || 'Cumplimiento'}</p>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: '#10B981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
                        </div>
                    </div>
                    <h3 className="text-h1" style={{ fontSize: '32px', marginBottom: '4px' }}>{stats?.compliance || '94%'}</h3>
                    <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '2px', marginTop: '8px' }}>
                        <div style={{ height: '100%', width: stats?.compliance || '94%', backgroundColor: '#10B981', borderRadius: '2px' }}></div>
                    </div>
                </Card>
            </div>


            {/* Operational sections */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px'
            }}>
                {/* Column 1: Tasks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

                {/* Column 2: Next Meeting */}
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
                </div>
            </div>

        </div>
    );
};



