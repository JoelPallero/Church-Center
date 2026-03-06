import type { FC } from 'react';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';

interface MeetingFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialChurchId?: number | null;
}

interface Church {
    id: number;
    name: string;
}

export const MeetingForm: FC<MeetingFormProps> = ({ onSuccess, onCancel, initialChurchId }) => {
    const { t } = useTranslation();
    const { isMaster, user } = useAuth();
    const [churches, setChurches] = useState<Church[]>([]);
    const PREDEFINED_CATEGORIES = [
        "Reuniones ocasionales",
        "Cambios de horario",
        "Reuniones especiales",
        "Reuniones de equipos",
        "Ensayos",
        "Reuniones que no cambian",
        "Reunión de jóvenes",
        "Reunión de adolescentes",
        "Reunión de preadolescentes",
        "Reunión de mujeres",
        "Reunión de hombres",
        "Evento",
        "Congreso",
        "Taller"
    ];

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        meeting_type: 'special' as 'special' | 'recurrent',
        location: '',
        category: '',
        custom_category: '', // Temporary field for "Other"
        church_id: initialChurchId || undefined as number | undefined,
        date: new Date().toISOString().split('T')[0], // For special meetings
        recurrence: {
            day_of_week: 0,
            start_time: '19:00',
            end_time: '21:00',
            timezone: 'America/Argentina/Buenos_Aires'
        }
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const logInteraction = (action: string, data: any = {}) => {
        console.log(`[MeetingForm Interaction] ${action}`, {
            user: user?.id,
            isMaster,
            initialChurchId,
            formData,
            ...data,
            timestamp: new Date().toISOString()
        });
    };

    useEffect(() => {
        logInteraction('Form Initialized');
        if (isMaster) {
            fetchChurches();
        }
    }, [isMaster]);

    const fetchChurches = async () => {
        try {
            logInteraction('Fetching Churches');
            const response = await api.get('/churches', {
                params: { action: 'my_churches' }
            });
            if (response.data.success) {
                logInteraction('Churches Fetched Successfully', { count: response.data.churches.length });
                setChurches(response.data.churches);
            } else {
                logInteraction('Error Fetching Churches (Success=false)', { message: response.data.message });
            }
        } catch (err) {
            logInteraction('Exception Fetching Churches', { error: err });
            console.error('Error fetching churches:', err);
        }
    };

    // We only show church selection if user is SuperAdmin (Master) 
    const showChurchSelector = isMaster;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        logInteraction('Form Submitted');

        // Robust check for church_id
        const effectiveChurchId = formData.church_id || initialChurchId || user?.churchId;

        if (!effectiveChurchId) {
            logInteraction('Validation Failed: No Church Found');
            alert(t('common.selectChurch'));
            return;
        }

        const finalCategory = formData.category === 'Otros' ? formData.custom_category : formData.category;

        setIsSubmitting(true);
        try {
            const postData = {
                ...formData,
                churchId: effectiveChurchId,
                category: finalCategory,
                // If it's special, start_at should be date + 00:00:00 or current time
                start_at: formData.meeting_type === 'special' ? `${formData.date} ${formData.recurrence.start_time}:00` : null
            };
            logInteraction('Sending Post Data', { postData });
            const response = await api.post('/calendar', postData);

            if (response.data.success) {
                logInteraction('Meeting Created Successfully', { response: response.data });
                onSuccess();
            } else {
                logInteraction('Meeting Creation Failed (Success=false)', { response: response.data });
                alert(response.data.message || 'Error al crear la reunión');
            }
        } catch (err: any) {
            logInteraction('Exception Creating Meeting', {
                error: err.message,
                response: err.response?.data
            });
            console.error('Error creating meeting:', err);
            alert(err.response?.data?.message || 'Error de conexión');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        logInteraction('Input Changed', { name, value });
        if (name.startsWith('recurrence.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                recurrence: { ...prev.recurrence, [field]: value }
            }));
        } else if (name === 'church_id') {
            setFormData(prev => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };


    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {showChurchSelector && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    <label className="text-overline" style={{ display: 'block', marginBottom: '4px' }}>{t('common.church')}</label>
                    <select
                        name="church_id"
                        value={formData.church_id || ''}
                        onChange={handleChange}
                        style={{ width: '100%' }}
                        required
                    >
                        <option value="">{t('common.selectChurch')}</option>
                        {churches.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}

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
                <label className="text-overline" style={{ display: 'block', marginBottom: '4px' }}>Categoría / Tag</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        style={{ flex: 1 }}
                    >
                        <option value="">Sin categoría</option>
                        {PREDEFINED_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="Otros">Otros (Personalizado)</option>
                    </select>
                    {formData.category === 'Otros' && (
                        <input
                            type="text"
                            name="custom_category"
                            placeholder="Escribe el tag..."
                            value={formData.custom_category}
                            onChange={handleChange}
                            style={{ flex: 1 }}
                            required
                        />
                    )}
                </div>
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
                {formData.meeting_type === 'special' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="text-overline" style={{ display: 'block', marginBottom: '4px' }}>{t('reunions.form.date') || 'Fecha'}</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            style={{ width: '100%' }}
                            required
                        />
                    </div>
                ) : (
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
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

            {formData.meeting_type === 'recurrent' && (
                <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p className="text-overline" style={{ color: 'var(--color-brand-blue)', marginBottom: '4px' }}>{t('reunions.form.weeklyConfig')}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="text-overline" style={{ display: 'block', marginBottom: '4px' }}>{t('reunions.form.day')}</label>
                        <select name="recurrence.day_of_week" value={formData.recurrence.day_of_week} onChange={handleChange} style={{ width: '100%' }}>
                            {[0, 1, 2, 3, 4, 5, 6].map(day => (
                                <option key={day} value={day}>{t(`days.${day}`)}</option>
                            ))}
                        </select>
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

