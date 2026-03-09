import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { useAuth } from '../../../../hooks/useAuth';
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

export const ConsolidationDashboard: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [visitors, setVisitors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'meetings' | 'database'>('meetings');
    const { isSuperAdmin, isMaster } = useAuth();
    const canEditAttendance = isSuperAdmin || isMaster; // Only these can edit if Pastor is restricted

    const churchId = searchParams.get('church_id');

    useEffect(() => {
        if (activeTab === 'meetings') {
            fetchMeetings();
        } else {
            fetchVisitors();
        }
    }, [churchId, activeTab]);

    const fetchMeetings = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/consolidation/report', {
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

    const fetchVisitors = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/consolidation/database', {
                params: { church_id: churchId }
            });
            if (response.data.success) {
                setVisitors(response.data.visitors);
            }
        } catch (err) {
            console.error('Error fetching visitors database:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
            <header style={{ marginBottom: '32px' }}>
                <h1 className="text-h1">{t('consolidation.title')}</h1>
                <p className="text-body" style={{ color: '#9CA3AF' }}>{t('consolidation.description')}</p>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--color-border-subtle)', marginBottom: '24px' }}>
                <div
                    onClick={() => setActiveTab('meetings')}
                    style={{
                        padding: '12px 4px',
                        cursor: 'pointer',
                        color: activeTab === 'meetings' ? 'var(--color-brand-blue)' : 'var(--color-ui-text-soft)',
                        borderBottom: activeTab === 'meetings' ? '2px solid var(--color-brand-blue)' : 'none',
                        fontWeight: activeTab === 'meetings' ? 600 : 500
                    }}
                >
                    {t('reunions.title')}
                </div>
                <div
                    onClick={() => setActiveTab('database')}
                    style={{
                        padding: '12px 4px',
                        cursor: 'pointer',
                        color: activeTab === 'database' ? 'var(--color-brand-blue)' : 'var(--color-ui-text-soft)',
                        borderBottom: activeTab === 'database' ? '2px solid var(--color-brand-blue)' : 'none',
                        fontWeight: activeTab === 'database' ? 600 : 500
                    }}
                >
                    {t('consolidation.consolidated')}
                </div>
            </div>

            {isLoading ? (
                <div className="flex-center" style={{ height: '300px' }}><div className="spinner" /></div>
            ) : activeTab === 'meetings' ? (
                <div style={{ display: 'grid', gap: '16px' }}>
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
                                            <span className="text-overline" style={{ fontSize: '10px' }}>{t('consolidation.total')}</span>
                                            <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--color-brand-blue)' }}>{m.total || 0}</p>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <span className="text-overline" style={{ fontSize: '10px' }}>{t('consolidation.visitors')}</span>
                                            <p style={{ margin: 0, fontWeight: 'bold', color: '#10B981' }}>{m.visitors_count || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                {canEditAttendance && (
                                    <Button
                                        label={t('common.edit')}
                                        variant="secondary"
                                        onClick={() => navigate(`/mainhub/consolidation/attendance/${m.id}${churchId ? `?church_id=${churchId}` : ''}`)}
                                    />
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            ) : (
                <Card style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left' }} className="text-overline">{t('consolidation.visitorForm.firstName')}</th>
                                <th style={{ padding: '12px', textAlign: 'left' }} className="text-overline">{t('consolidation.visitorForm.phone')}</th>
                                <th style={{ padding: '12px', textAlign: 'left' }} className="text-overline">Primera Visita</th>
                                <th style={{ padding: '12px', textAlign: 'center' }} className="text-overline">Seguimiento</th>
                                <th style={{ padding: '12px', textAlign: 'right' }} className="text-overline"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {visitors.map(v => (
                                <tr key={v.id} style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                                    <td style={{ padding: '12px' }}>
                                        <div className="text-body" style={{ fontWeight: 600 }}>{v.first_name} {v.last_name}</div>
                                        <div className="text-overline" style={{ fontSize: '10px', color: '#6B7280' }}>{v.email}</div>
                                    </td>
                                    <td style={{ padding: '12px' }} className="text-body">{v.whatsapp || v.phone}</td>
                                    <td style={{ padding: '12px' }}>
                                        <div className="text-body" style={{ fontSize: '14px' }}>{v.first_meeting_title || 'N/A'}</div>
                                        <div className="text-overline" style={{ fontSize: '10px' }}>{v.first_visit_date ? new Date(v.first_visit_date).toLocaleDateString() : 'N/A'}</div>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            backgroundColor: v.follow_up_count > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            color: v.follow_up_count > 0 ? '#10B981' : '#F59E0B',
                                            fontSize: '12px',
                                            fontWeight: 600
                                        }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>history</span>
                                            {v.follow_up_count || 0}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                        <Button
                                            label="Seguimiento"
                                            variant="ghost"
                                            className="text-brand-blue"
                                            style={{ minWidth: 'auto' }}
                                            onClick={() => navigate(`/mainhub/consolidation/visitor/${v.id}`)}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {visitors.length === 0 && (
                                <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', opacity: 0.5 }}>No hay visitantes registrados en la base de datos.</td></tr>
                            )}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
};
