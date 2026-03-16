import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../components/ui/Card';
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
            <div className="dashboard-stats-grid">
                <Card className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>{t('pastor.stats.activeTeam') || 'Equipo Activo'}</p>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--color-brand-blue)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>groups</span>
                        </div>
                    </div>
                    <h3 className="text-h1">{stats?.active_members || 0}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '11px', fontWeight: 600 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span>
                        <span>+12% vs mes ant.</span>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>{t('pastor.stats.monthlyMeetings') || 'Ensayos / Reuniones'}</p>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            color: '#8B5CF6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>event_available</span>
                        </div>
                    </div>
                    <h3 className="text-h1">{stats?.meetings_count || 0}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-ui-text-soft)', fontSize: '11px' }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Mañana 19:00</span>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>Canciones en Base</p>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(255, 184, 0, 0.1)',
                            color: '#FFB800',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>library_music</span>
                        </div>
                    </div>
                    <h3 className="text-h1">128</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280', fontSize: '11px' }}>
                        <span>8 nuevas este mes</span>
                    </div>
                </Card>


            </div>

            {/* Operational sections removed for Pastor per request */}
        </div>
    );
};
