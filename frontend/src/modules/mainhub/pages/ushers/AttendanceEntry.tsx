import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import api from '../../../../services/api';

interface Visitor {
    id?: number;
    first_name: string;
    last_name: string;
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
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [isSavingCount, setIsSavingCount] = useState(false);
    const [isModaling, setIsModaling] = useState(false);
    const [newVisitor, setNewVisitor] = useState<Visitor>({
        first_name: '', last_name: '', phone: '', email: '', is_first_time: true, notes: ''
    });

    // const churchId = searchParams.get('church_id');

    useEffect(() => {
        fetchData();
    }, [meetingId]);

    const fetchData = async () => {
        try {
            const response = await api.get('/attendance', { params: { meeting_id: meetingId } });
            if (response.data.success) {
                if (response.data.count) {
                    setAdults(response.data.count.adults);
                    setChildren(response.data.count.children);
                }
                setVisitors(response.data.visitors || []);
            }
        } catch (err) {
            console.error('Error fetching attendance:', err);
        }
    };

    const handleSaveCount = async () => {
        setIsSavingCount(true);
        try {
            await api.post(`/attendance/count?meeting_id=${meetingId}`, { adults, children });
        } catch (err) {
            console.error('Error saving count:', err);
        } finally {
            setIsSavingCount(false);
        }
    };

    const handleAddVisitor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post(`/attendance/visitor?meeting_id=${meetingId}`, newVisitor);
            if (response.data.success) {
                setIsModaling(false);
                setNewVisitor({ first_name: '', last_name: '', phone: '', email: '', is_first_time: true, notes: '' });
                fetchData();
            }
        } catch (err) {
            console.error('Error adding visitor:', err);
        }
    };

    const handleDeleteVisitor = async (id: number) => {
        if (!confirm(t('common.confirmDelete'))) return;
        try {
            await api.delete(`/attendance/visitor?id=${id}`);
            fetchData();
        } catch (err) {
            console.error('Error deleting visitor:', err);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
            <Button label={t('common.back')} icon="arrow_back" variant="ghost" onClick={() => navigate(-1)} style={{ marginBottom: '16px' }} />

            <h1 className="text-h1" style={{ marginBottom: '24px' }}>{t('ushers.attendance')}</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <Card style={{ padding: '24px' }}>
                    <label className="text-overline" style={{ display: 'block', marginBottom: '8px' }}>{t('ushers.adults')}</label>
                    <input
                        type="number"
                        value={adults}
                        onChange={e => setAdults(parseInt(e.target.value) || 0)}
                        style={{ width: '100%', padding: '12px', fontSize: '24px', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--color-border-subtle)', backgroundColor: 'transparent', color: 'var(--color-ui-text)' }}
                    />
                </Card>
                <Card style={{ padding: '24px' }}>
                    <label className="text-overline" style={{ display: 'block', marginBottom: '8px' }}>{t('ushers.children')}</label>
                    <input
                        type="number"
                        value={children}
                        onChange={e => setChildren(parseInt(e.target.value) || 0)}
                        style={{ width: '100%', padding: '12px', fontSize: '24px', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--color-border-subtle)', backgroundColor: 'transparent', color: 'var(--color-ui-text)' }}
                    />
                </Card>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
                <Button label={t('ushers.saveCount')} icon="save" onClick={handleSaveCount} disabled={isSavingCount} style={{ width: '200px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className="text-h2">{t('ushers.visitors')}</h2>
                <Button label={t('ushers.addVisitor')} icon="person_add" variant="secondary" onClick={() => setIsModaling(true)} />
            </div>

            <Card style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <tr>
                            <th style={{ padding: '12px', textAlign: 'left' }} className="text-overline">{t('ushers.visitorForm.firstName')}</th>
                            <th style={{ padding: '12px', textAlign: 'left' }} className="text-overline">{t('ushers.visitorForm.phone')}</th>
                            <th style={{ padding: '12px', textAlign: 'left' }} className="text-overline">{t('ushers.visitorForm.email')}</th>
                            <th style={{ padding: '12px', textAlign: 'right' }} className="text-overline"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {visitors.map(v => (
                            <tr key={v.id} style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                                <td style={{ padding: '12px' }} className="text-body">{v.first_name} {v.last_name}</td>
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
                            <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', opacity: 0.5 }}>{t('ushers.noVisitors')}</td></tr>
                        )}
                    </tbody>
                </table>
            </Card>

            <Modal isOpen={isModaling} onClose={() => setIsModaling(false)} title={t('ushers.addVisitor')}>
                <form onSubmit={handleAddVisitor} style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="input-group">
                            <label>{t('ushers.visitorForm.firstName')}</label>
                            <input type="text" value={newVisitor.first_name} onChange={e => setNewVisitor({ ...newVisitor, first_name: e.target.value })} required />
                        </div>
                        <div className="input-group">
                            <label>{t('ushers.visitorForm.lastName')}</label>
                            <input type="text" value={newVisitor.last_name} onChange={e => setNewVisitor({ ...newVisitor, last_name: e.target.value })} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>{t('ushers.visitorForm.phone')}</label>
                        <input type="tel" value={newVisitor.phone} onChange={e => setNewVisitor({ ...newVisitor, phone: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>{t('ushers.visitorForm.email')}</label>
                        <input type="email" value={newVisitor.email} onChange={e => setNewVisitor({ ...newVisitor, email: e.target.value })} />
                    </div>
                    <div className="input-group">
                        <label>{t('ushers.visitorForm.notes')}</label>
                        <textarea value={newVisitor.notes} onChange={e => setNewVisitor({ ...newVisitor, notes: e.target.value })} rows={3} style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--color-border-subtle)', background: 'transparent', color: 'inherit', padding: '8px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                        <Button label={t('common.cancel')} variant="ghost" onClick={() => setIsModaling(false)} />
                        <Button label={t('common.add')} variant="primary" type="submit" />
                    </div>
                </form>
            </Modal>
        </div>
    );
};
