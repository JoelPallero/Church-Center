import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { useAuth } from '../../../../hooks/useAuth';
import api from '../../../../services/api';

interface Visitor {
    id?: number;
    first_name: string;
    surname: string;
    phone: string;
    email: string;
    is_first_time: boolean;
    notes: string;
}

export const AttendanceEntry: FC = () => {
    const { t } = useTranslation();
    const { meetingId } = useParams();
    const navigate = useNavigate();
    const [adults, setAdults] = useState(0);
    const [children, setChildren] = useState(0);
    const [newPeople, setNewPeople] = useState(0);
    const [meeting, setMeeting] = useState<any>(null);
    const [isPastOrCurrent, setIsPastOrCurrent] = useState(false);
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [isSavingCount, setIsSavingCount] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newVisitor, setNewVisitor] = useState<Visitor>({
        first_name: '', surname: '', phone: '', email: '', is_first_time: true, notes: ''
    });
    const { isPastor, isSuperAdmin, isMaster, isUjier } = useAuth();

    useEffect(() => {
        if (isPastor || isUjier || isSuperAdmin || isMaster) {
            fetchData();
        } else {
            navigate('/mainhub/consolidation');
        }
    }, [meetingId, isPastor, isSuperAdmin, isMaster, navigate]);

    const fetchData = async () => {
        try {
            const [consolidationRes, meetingRes] = await Promise.all([
                api.get('/consolidation', { params: { meeting_id: meetingId } }),
                api.get(`/meetings/${meetingId}`)
            ]);

            if (consolidationRes.data.success) {
                if (consolidationRes.data.count) {
                    setAdults(consolidationRes.data.count.adults);
                    setChildren(consolidationRes.data.count.children);
                    setNewPeople(consolidationRes.data.count.new_people || 0);
                }
                setVisitors(consolidationRes.data.visitors || []);
            }

            if (meetingRes.data.success) {
                const meetingData = meetingRes.data.meeting;
                setMeeting(meetingData);
                
                // Time check
                const startAt = new Date(meetingData.start_at).getTime();
                const now = new Date().getTime();
                setIsPastOrCurrent(now >= startAt);
            }
        } catch (err) {
            console.error('Error fetching attendance data:', err);
        }
    };

    const handleSaveCount = async () => {
        if (!isPastOrCurrent) return;
        setIsSavingCount(true);
        try {
            await api.post(`/consolidation/count?meeting_id=${meetingId}`, { adults, children, newPeople });
        } catch (err) {
            console.error('Error saving count:', err);
        } finally {
            setIsSavingCount(false);
        }
    };

    const handleAddVisitor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isPastOrCurrent) return;
        try {
            const response = await api.post(`/consolidation/visitor?meeting_id=${meetingId}`, newVisitor);
            if (response.data.success) {
                setIsModalOpen(false);
                setNewVisitor({ first_name: '', surname: '', phone: '', email: '', is_first_time: true, notes: '' });
                fetchData();
            }
        } catch (err) {
            console.error('Error adding visitor:', err);
        }
    };

    const handleDeleteVisitor = async (id: number) => {
        if (!confirm(t('common.confirmDelete'))) return;
        try {
            await api.delete(`/consolidation/visitor`, { params: { id } });
            fetchData();
        } catch (err) {
            console.error('Error deleting visitor:', err);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
            <Button label={t('common.back')} icon="arrow_back" variant="ghost" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }} />

            {meeting && (
                <div style={{ marginBottom: '24px' }}>
                    <h1 className="text-h1" style={{ marginBottom: '4px' }}>{meeting.title || t('consolidation.attendance')}</h1>
                    <p className="text-body" style={{ opacity: 0.7 }}>
                        {new Date(meeting.start_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            )}

            {!isPastOrCurrent && meeting && (
                <Card style={{ padding: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#EF4444' }}>
                        <span className="material-symbols-outlined">warning</span>
                        <p className="text-body" style={{ fontWeight: 600 }}>
                            Esta reunión aún no ha comenzado. Solo podrás registrar asistencia una vez que inicie.
                        </p>
                    </div>
                </Card>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <Card style={{ padding: '24px' }}>
                    <label className="text-overline" style={{ display: 'block', marginBottom: '8px' }}>{t('consolidation.adults')}</label>
                    <input
                        type="number"
                        value={adults}
                        onChange={e => setAdults(parseInt(e.target.value) || 0)}
                        disabled={!isPastOrCurrent || isSavingCount}
                        style={{ width: '100%', padding: '12px', fontSize: '24px', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--color-border-subtle)', backgroundColor: 'transparent', color: 'var(--color-ui-text)', opacity: isPastOrCurrent ? 1 : 0.5 }}
                    />
                </Card>
                <Card style={{ padding: '24px' }}>
                    <label className="text-overline" style={{ display: 'block', marginBottom: '8px' }}>{t('consolidation.children')}</label>
                    <input
                        type="number"
                        value={children}
                        onChange={e => setChildren(parseInt(e.target.value) || 0)}
                        disabled={!isPastOrCurrent || isSavingCount}
                        style={{ width: '100%', padding: '12px', fontSize: '24px', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--color-border-subtle)', backgroundColor: 'transparent', color: 'var(--color-ui-text)', opacity: isPastOrCurrent ? 1 : 0.5 }}
                    />
                </Card>
                <Card style={{ padding: '24px' }}>
                    <label className="text-overline" style={{ display: 'block', marginBottom: '8px' }}>{t('consolidation.newPeople')}</label>
                    <input
                        type="number"
                        value={newPeople}
                        onChange={e => setNewPeople(parseInt(e.target.value) || 0)}
                        disabled={!isPastOrCurrent || isSavingCount}
                        style={{ width: '100%', padding: '12px', fontSize: '24px', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--color-border-subtle)', backgroundColor: 'transparent', color: 'var(--color-ui-text)', opacity: isPastOrCurrent ? 1 : 0.5 }}
                    />
                </Card>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
                <Button 
                    label={t('consolidation.saveCount')} 
                    icon="save" 
                    onClick={handleSaveCount} 
                    disabled={isSavingCount || !isPastOrCurrent} 
                    style={{ width: '200px' }} 
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className="text-h2">{t('consolidation.visitors')}</h2>
                <Button 
                    label={t('consolidation.addVisitor')} 
                    icon="person_add" 
                    variant="secondary" 
                    onClick={() => setIsModalOpen(true)} 
                    disabled={!isPastOrCurrent}
                />
            </div>

            <Card style={{ overflow: 'visible' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <tr>
                            <th style={{ padding: '12px', textAlign: 'left' }} className="text-overline">{t('consolidation.visitorForm.firstName')}</th>
                            <th style={{ padding: '12px', textAlign: 'left' }} className="text-overline">{t('consolidation.visitorForm.phone')}</th>
                            <th style={{ padding: '12px', textAlign: 'left' }} className="text-overline">{t('consolidation.visitorForm.email')}</th>
                            <th style={{ padding: '12px', textAlign: 'right' }} className="text-overline"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {visitors.map(v => (
                            <tr key={v.id} style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                                <td style={{ padding: '12px' }} className="text-body">{v.first_name} {v.surname}</td>
                                <td style={{ padding: '12px' }} className="text-body">{v.phone}</td>
                                <td style={{ padding: '12px' }} className="text-body">{v.email}</td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                    <button onClick={() => handleDeleteVisitor(v.id!)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {visitors.length === 0 && (
                            <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', opacity: 0.5 }}>{t('consolidation.noVisitors')}</td></tr>
                        )}
                    </tbody>
                </table>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('consolidation.addVisitor')}>
                <form onSubmit={handleAddVisitor} style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="input-group">
                            <label>{t('consolidation.visitorForm.firstName')}</label>
                            <input type="text" value={newVisitor.first_name} onChange={e => setNewVisitor({ ...newVisitor, first_name: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>{t('consolidation.visitorForm.lastName')}</label>
                            <input type="text" value={newVisitor.surname} onChange={e => setNewVisitor({ ...newVisitor, surname: e.target.value })} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>{t('consolidation.visitorForm.phone')}</label>
                        <input type="tel" value={newVisitor.phone} onChange={e => setNewVisitor({ ...newVisitor, phone: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>{t('consolidation.visitorForm.email')}</label>
                        <input type="email" value={newVisitor.email} onChange={e => setNewVisitor({ ...newVisitor, email: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>{t('consolidation.visitorForm.notes')}</label>
                        <textarea value={newVisitor.notes} onChange={e => setNewVisitor({ ...newVisitor, notes: e.target.value })} rows={3} style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--color-border-subtle)', background: 'transparent', color: 'inherit', padding: '8px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                        <Button label={t('common.cancel')} variant="ghost" onClick={() => setIsModalOpen(false)} />
                        <Button label={t('common.add')} variant="primary" type="submit" />
                    </div>
                </form>
            </Modal>
        </div>
    );
};
