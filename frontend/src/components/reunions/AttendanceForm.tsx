import { useState, useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface AttendanceFormProps {
    meetingId: number;
    eventDate: string;
    onSuccess: () => void;
    onCancel: () => void;
}

interface Visitor {
    id?: number;
    first_name: string;
    surname: string;
    phone: string;
    email: string;
    notes: string;
}

export const AttendanceForm: FC<AttendanceFormProps> = ({ meetingId, eventDate, onSuccess, onCancel }) => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [attendance, setAttendance] = useState({
        adults: 0,
        children: 0,
        new_people: 0
    });
    const [visitors, setVisitors] = useState<Visitor[]>([]);

    useEffect(() => {
        fetchAttendance();
    }, [meetingId, eventDate]);

    const fetchAttendance = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/calendar/attendance?meeting_id=${meetingId}&date=${eventDate}`);
            if (response.data.success) {
                if (response.data.attendance) {
                    setAttendance({
                        adults: response.data.attendance.adults || 0,
                        children: response.data.attendance.children || 0,
                        new_people: response.data.attendance.new_people || 0
                    });
                }
                setVisitors(response.data.visitors || []);
            }
        } catch (err) {
            console.error('Error fetching attendance:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await api.post('/calendar/attendance', {
                meeting_id: meetingId,
                date: eventDate,
                adults: attendance.adults,
                children: attendance.children,
                new_people: visitors.length,
                visitors: visitors
            });

            if (response.data.success) {
                addToast(t('songs.saveSuccess'), 'success');
                onSuccess();
            }
        } catch (err) {
            console.error('Error saving attendance:', err);
            addToast(t('common.failed'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const addVisitor = () => {
        setVisitors([...visitors, { first_name: '', surname: '', phone: '', email: '', notes: '' }]);
    };

    const removeVisitor = (index: number) => {
        setVisitors(visitors.filter((_, i) => i !== index));
    };

    const updateVisitor = (index: number, field: keyof Visitor, value: string) => {
        const newVisitors = [...visitors];
        newVisitors[index] = { ...newVisitors[index], [field]: value };
        setVisitors(newVisitors);
    };

    if (isLoading) return <div className="flex-center" style={{ height: '200px' }}><div className="spinner" /></div>;

    return (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                    <label className="text-overline">{t('consolidation.adults')}</label>
                    <input 
                        type="number" 
                        min="0"
                        value={attendance.adults} 
                        onChange={e => setAttendance({ ...attendance, adults: parseInt(e.target.value) || 0 })}
                        required
                    />
                </div>
                <div className="input-group">
                    <label className="text-overline">{t('consolidation.children')}</label>
                    <input 
                        type="number" 
                        min="0"
                        value={attendance.children} 
                        onChange={e => setAttendance({ ...attendance, children: parseInt(e.target.value) || 0 })}
                        required
                    />
                </div>
            </div>

            <section style={{ marginTop: '12px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 className="text-overline">{t('consolidation.newPeople')} ({visitors.length})</h4>
                    <Button type="button" variant="ghost" icon="person_add" onClick={addVisitor} />
                </header>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {visitors.map((visitor, idx) => (
                        <div key={idx} style={{ 
                            padding: '16px', 
                            backgroundColor: 'rgba(59, 130, 246, 0.05)', 
                            borderRadius: '12px',
                            border: '1px solid rgba(59, 130, 246, 0.1)',
                            position: 'relative'
                        }}>
                            <Button 
                                type="button"
                                variant="ghost" 
                                icon="close" 
                                onClick={() => removeVisitor(idx)} 
                                style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px' }} 
                            />
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                <input 
                                    placeholder={t('consolidation.visitorForm.firstName')} 
                                    value={visitor.first_name} 
                                    onChange={e => updateVisitor(idx, 'first_name', e.target.value)}
                                    required
                                />
                                <input 
                                    placeholder={t('consolidation.visitorForm.lastName')} 
                                    value={visitor.surname} 
                                    onChange={e => updateVisitor(idx, 'surname', e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                <input 
                                    placeholder={t('consolidation.visitorForm.phone')} 
                                    value={visitor.phone} 
                                    onChange={e => updateVisitor(idx, 'phone', e.target.value)}
                                />
                                <input 
                                    type="email"
                                    placeholder={t('consolidation.visitorForm.email')} 
                                    value={visitor.email} 
                                    onChange={e => updateVisitor(idx, 'email', e.target.value)}
                                />
                            </div>
                            <textarea 
                                placeholder={t('consolidation.visitorForm.notes')} 
                                value={visitor.notes}
                                onChange={e => updateVisitor(idx, 'notes', e.target.value)}
                                rows={2}
                                style={{ width: '100%', fontSize: '13px' }}
                            />
                        </div>
                    ))}
                    
                    {visitors.length === 0 && (
                        <p style={{ textAlign: 'center', color: 'var(--color-ui-text-soft)', fontSize: '14px', fontStyle: 'italic', padding: '20px' }}>
                            {t('consolidation.noVisitors')}
                        </p>
                    )}
                </div>
            </section>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <Button label={t('common.cancel')} variant="secondary" onClick={onCancel} style={{ flex: 1 }} type="button" />
                <Button
                    label={isSaving ? t('common.sending') : t('consolidation.saveCount')}
                    variant="primary"
                    style={{ flex: 1 }}
                    type="submit"
                    disabled={isSaving}
                />
            </div>
        </form>
    );
};
