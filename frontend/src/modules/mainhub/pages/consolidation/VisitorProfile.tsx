import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import api from '../../../../services/api';

interface FollowUp {
    id: number;
    contact_date: string;
    contact_method: string;
    comments: string;
    created_by_name: string;
}

export const VisitorProfile: FC = () => {
    const { t } = useTranslation();
    const { visitorId } = useParams();
    const navigate = useNavigate();
    const [visitor, setVisitor] = useState<any>(null);
    const [logs, setLogs] = useState<FollowUp[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModaling, setIsModaling] = useState(false);
    const [newLog, setNewLog] = useState({
        date: new Date().toISOString().split('T')[0],
        method: 'WhatsApp',
        comments: ''
    });

    useEffect(() => {
        fetchData();
    }, [visitorId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // We'll get basic info by searching the database for this specific visitor
            // For now, let's assume getFollowUps also returns visitor info or we have another endpoint
            const response = await api.get(`/consolidation/followups`, {
                params: { visitor_id: visitorId }
            });
            if (response.data.success) {
                setLogs(response.data.logs);
                // In a real scenario, the backend would return visitor details too
                // For now we'll mock it if not present
                setVisitor(response.data.visitor || { first_name: 'Visitante', last_name: '' });
            }
        } catch (err) {
            console.error('Error fetching follow-ups:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post(`/consolidation/followup`, {
                visitor_id: visitorId,
                ...newLog
            });
            if (response.data.success) {
                setIsModaling(false);
                setNewLog({ date: new Date().toISOString().split('T')[0], method: 'WhatsApp', comments: '' });
                fetchData();
            }
        } catch (err) {
            console.error('Error adding follow-up:', err);
        }
    };

    if (isLoading) return <div className="flex-center" style={{ height: '300px' }}><div className="spinner" /></div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
            <Button label={t('common.back')} icon="arrow_back" variant="ghost" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }} />

            <Card style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, var(--color-brand-blue-deep), var(--color-brand-blue))', color: 'white' }}>
                <h1 className="text-h1" style={{ color: 'white', marginBottom: '8px' }}>{visitor?.first_name} {visitor?.last_name}</h1>
                <div style={{ display: 'flex', gap: '20px', opacity: 0.9 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>call</span>
                        <span className="text-body">{visitor?.whatsapp || visitor?.phone || 'No registrado'}</span>
                    </div>
                    {visitor?.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>mail</span>
                            <span className="text-body">{visitor.email}</span>
                        </div>
                    )}
                </div>
                {visitor?.prayer_requests && (
                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                        <p className="text-overline" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Motivos de Oración</p>
                        <p className="text-body" style={{ fontSize: '14px' }}>{visitor.prayer_requests}</p>
                    </div>
                )}
            </Card>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className="text-h2">{t('consolidation.followUp.title')}</h2>
                <Button label={t('consolidation.followUp.addLog')} icon="add_comment" variant="secondary" onClick={() => setIsModaling(true)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {logs.map(log => (
                    <Card key={log.id} style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)', fontSize: '20px' }}>
                                    {log.contact_method === 'WhatsApp' ? 'chat' : log.contact_method === 'Phone' ? 'call' : 'person'}
                                </span>
                                <span style={{ fontWeight: 600 }}>{log.contact_method}</span>
                            </div>
                            <span className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>
                                {new Date(log.contact_date).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-body" style={{ margin: '8px 0', fontSize: '15px' }}>{log.comments}</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <span className="text-overline" style={{ fontSize: '10px', opacity: 0.6 }}>Registrado por: {log.created_by_name}</span>
                        </div>
                    </Card>
                ))}
                {logs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px', opacity: 0.5 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '12px' }}>history</span>
                        <p>{t('consolidation.followUp.noLogs')}</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isModaling} onClose={() => setIsModaling(false)} title={t('consolidation.followUp.addLog')}>
                <form onSubmit={handleAddLog} style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="input-group">
                            <label>{t('consolidation.followUp.date')}</label>
                            <input type="date" value={newLog.date} onChange={e => setNewLog({ ...newLog, date: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>{t('consolidation.followUp.method')}</label>
                            <select value={newLog.method} onChange={e => setNewLog({ ...newLog, method: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)', background: 'transparent', color: 'inherit' }}>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="Llamada">Llamada</option>
                                <option value="Visita">Visita</option>
                                <option value="Email">Email</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                    </div>
                    <div className="input-group">
                        <label>{t('consolidation.followUp.comments')}</label>
                        <textarea value={newLog.comments} onChange={e => setNewLog({ ...newLog, comments: e.target.value })} rows={4} required placeholder="Describe el resultado del contacto..." style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--color-border-subtle)', background: 'transparent', color: 'inherit', padding: '8px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                        <Button label={t('common.cancel')} variant="ghost" onClick={() => setIsModaling(false)} />
                        <Button label={t('common.save')} variant="primary" type="submit" />
                    </div>
                </form>
            </Modal>
        </div>
    );
};
