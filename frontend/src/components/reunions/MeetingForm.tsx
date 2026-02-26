import type { FC } from 'react';
import { useState } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

interface MeetingFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export const MeetingForm: FC<MeetingFormProps> = ({ onSuccess, onCancel }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        meeting_type: 'special' as 'special' | 'recurrent',
        location: '',
        recurrence: {
            day_of_week: 0,
            start_time: '19:00',
            end_time: '21:00',
            timezone: 'America/Argentina/Buenos_Aires'
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await api.post('/calendar', formData);
            if (response.data.success) {
                onSuccess();
            }
        } catch (err) {
            console.error('Error creating meeting:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('recurrence.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                recurrence: { ...prev.recurrence, [field]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label className="text-overline" style={{ display: 'block', marginBottom: '4px' }}>{t('reunions.form.title')}</label>
                <input
                    type="text"
                    name="title"
                    placeholder={t('reunions.form.placeholders.title')}
                    value={formData.title}
                    onChange={handleChange}
                    style={{ width: '100%' }}
                    required
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                <label className="text-overline" style={{ display: 'block', marginBottom: '4px' }}>{t('reunions.form.description')}</label>
                <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    style={{ width: '100%' }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="text-overline" style={{ display: 'block', marginBottom: '4px' }}>{t('reunions.form.type')}</label>
                    <select name="meeting_type" value={formData.meeting_type} onChange={handleChange} style={{ width: '100%' }}>
                        <option value="special">{t('reunions.form.types.special')}</option>
                        <option value="recurrent">{t('reunions.form.types.recurrent')}</option>
                    </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="text-overline" style={{ display: 'block', marginBottom: '4px' }}>{t('reunions.form.location')}</label>
                    <input
                        type="text"
                        name="location"
                        placeholder={t('reunions.form.placeholders.location')}
                        value={formData.location}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {formData.meeting_type === 'recurrent' && (
                <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p className="text-overline" style={{ color: 'var(--color-brand-blue)', marginBottom: '4px' }}>{t('reunions.form.weeklyConfig')}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '4px' }}>{t('reunions.form.day')}</label>
                            <select name="recurrence.day_of_week" value={formData.recurrence.day_of_week} onChange={handleChange} style={{ width: '100%' }}>
                                {[0, 1, 2, 3, 4, 5, 6].map(day => (
                                    <option key={day} value={day}>{t(`days.${day}`)}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '4px' }}>{t('reunions.form.startTime')}</label>
                            <input
                                type="time"
                                name="recurrence.start_time"
                                value={formData.recurrence.start_time}
                                onChange={handleChange}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '4px' }}>{t('reunions.form.endTime')}</label>
                            <input
                                type="time"
                                name="recurrence.end_time"
                                value={formData.recurrence.end_time}
                                onChange={handleChange}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <Button label={t('common.cancel')} variant="secondary" onClick={onCancel} style={{ flex: 1 }} type="button" />
                <Button
                    label={isSubmitting ? t('reunions.form.creating') : t('reunions.form.create')}
                    variant="primary"
                    style={{ flex: 1 }}
                    type="submit"
                    disabled={isSubmitting}
                />
            </div>
        </form>
    );
};
