import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import api from '../../../../services/api';

interface Meeting {
    id: number;
    title: string;
    instance_date: string;
    adults?: number;
    children?: number;
    total?: number;
    visitors_count?: number;
}

export const UshersDashboard: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const churchId = searchParams.get('church_id');

    useEffect(() => {
        fetchMeetings();
    }, [churchId]);

    const fetchMeetings = async () => {
        try {
            const response = await api.get('/attendance/report', {
                params: { church_id: churchId }
            });
            if (response.data.success) {
                setMeetings(response.data.report);
            }
        } catch (err) {
            console.error('Error fetching attendance report:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="text-h1">{t('ushers.title')}</h1>
                    <p className="text-body" style={{ color: '#9CA3AF' }}>{t('ushers.description')}</p>
                </div>
            </header>

            <div style={{ display: 'grid', gap: '16px' }}>
                <h2 className="text-h2">{t('ushers.reports')}</h2>
                {isLoading ? (
                    <div className="flex-center" style={{ height: '200px' }}><div className="spinner" /></div>
                ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {meetings.map(m => (
                            <Card key={m.id} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 className="text-h3" style={{ margin: 0 }}>{m.title}</h3>
                                    <p style={{ color: '#6B7280', fontSize: '14px', margin: '4px 0' }}>
                                        {new Date(m.instance_date || (m as any).start_at).toLocaleDateString()}
                                    </p>
                                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <span className="text-overline" style={{ fontSize: '10px' }}>{t('ushers.total')}</span>
                                            <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--color-brand-blue)' }}>{m.total || 0}</p>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <span className="text-overline" style={{ fontSize: '10px' }}>{t('ushers.visitors')}</span>
                                            <p style={{ margin: 0, fontWeight: 'bold', color: '#10B981' }}>{m.visitors_count || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    label={t('common.edit')}
                                    variant="secondary"
                                    onClick={() => navigate(`/mainhub/ushers/attendance/${m.id}${churchId ? `?church_id=${churchId}` : ''}`)}
                                />
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
