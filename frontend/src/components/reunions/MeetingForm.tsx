import type { FC } from 'react';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';

interface MeetingCategory {
    id: number;
    name: string;
    color?: string;
    icon?: string;
}

interface MeetingData {
    id?: number;
    title: string;
    description?: string;
    meeting_type: 'special' | 'recurrent';
    location?: string;
    category?: string;
    church_id?: number;
    start_at?: string;
    end_at?: string;
    day_of_week?: number;
    start_time?: string;
    end_time?: string;
}

interface MeetingFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialChurchId?: number | null;
    initialData?: MeetingData | null;
}

interface Church {
    id: number;
    name: string;
}

export const MeetingForm: FC<MeetingFormProps> = ({ onSuccess, onCancel, initialChurchId, initialData }) => {
    const { t } = useTranslation();
    const { isMaster, user } = useAuth();
    const [churches, setChurches] = useState<Church[]>([]);
    const [categories, setCategories] = useState<MeetingCategory[]>([]);
    const [isAddingTag, setIsAddingTag] = useState(false);

    const isInvalidDate = (dateStr: string | null | undefined) => {
        if (!dateStr || dateStr.startsWith('0000-00-00')) return true;
        return isNaN(new Date(dateStr).getTime());
    };

    const initialDate = (initialData?.start_at && !isInvalidDate(initialData.start_at))
        ? initialData.start_at.split(' ')[0]
        : new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        meeting_type: (initialData?.meeting_type || 'special') as 'special' | 'recurrent',
        location: initialData?.location || '',
        category: initialData?.category || '',
        custom_category: '',
        church_id: initialData?.church_id || initialChurchId || undefined as number | undefined,
        date: initialDate,
        recurrence: {
            day_of_week: initialData?.day_of_week || 0,
            start_time: initialData?.start_time ? initialData.start_time.substring(0, 5) : '19:00',
            end_time: initialData?.end_time ? initialData.end_time.substring(0, 5) : '21:00',
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
        fetchCategories();
    }, [isMaster, formData.church_id, initialChurchId, user?.churchId]);

    const fetchChurches = async () => {
        try {
            logInteraction('Fetching Churches');
            const response = await api.get('/churches', {
                params: { action: 'my_churches' }
            });
            if (response.data.success) {
                logInteraction('Churches Fetched Successfully', { count: response.data.churches.length });
                setChurches(response.data.churches);
            }
        } catch (err) {
            console.error('Error fetching churches:', err);
        }
    };

    const fetchCategories = async () => {
        const effectiveChurchId = formData.church_id || initialChurchId || user?.churchId;
        if (!effectiveChurchId) return;

        try {
            const response = await api.get('/calendar/categories', {
                params: { church_id: effectiveChurchId }
            });
            if (response.data.success) {
                setCategories(response.data.categories);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const handleAddCategory = async () => {
        const effectiveChurchId = formData.church_id || initialChurchId || user?.churchId;
        if (!effectiveChurchId || !formData.custom_category.trim()) return;

        setIsAddingTag(true);
        try {
            const response = await api.post('/calendar/categories', {
                church_id: effectiveChurchId,
                name: formData.custom_category.trim()
            });

            if (response.data.success) {
                const newTag = formData.custom_category.trim();
                setFormData(prev => ({
                    ...prev,
                    category: newTag,
                    custom_category: ''
                }));
                // Re-fetch categories to get the full object (with ID/Color)
                fetchCategories();
            }
        } catch (err) {
            console.error('Error adding category:', err);
            alert('Error al guardar el nuevo tag');
        } finally {
            setIsAddingTag(false);
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

        // Ensure times are valid and in 24h format HH:mm
        const startTime = formData.recurrence.start_time || '19:00';
        const endTime = formData.recurrence.end_time || '21:00';

        setIsSubmitting(true);
        try {
            // For recurrent meetings, we calculate the next upcoming occurrence 
            // of the selected day of the week to set as the start_at date.
            let baseDate = formData.date;
            if (formData.meeting_type === 'recurrent') {
                const targetDay = formData.recurrence.day_of_week; // 0-6
                const now = new Date();
                const currentDay = now.getDay(); // 0-6

                // Calculate days until next occurrence
                let daysTill = targetDay - currentDay;
                if (daysTill < 0) daysTill += 7;

                const nextOccurence = new Date();
                nextOccurence.setDate(now.getDate() + daysTill);
                baseDate = nextOccurence.toISOString().split('T')[0];
            }

            const postData = {
                ...formData,
                churchId: effectiveChurchId,
                category: finalCategory,
                start_at: `${baseDate} ${startTime}:00`,
                end_at: `${baseDate} ${endTime}:00`,
                // Ensure recurrence times are also correctly set in HH:mm
                recurrence: {
                    ...formData.recurrence,
                    start_time: startTime,
                    end_time: endTime
                }
            };
            console.log('Meeting submission postData:', postData);
            logInteraction('Sending Submission Data', { postData });

            const response = initialData?.id
                ? await api.put(`/calendar/${initialData.id}`, postData)
                : await api.post('/calendar', postData);

            if (response.data.success) {
                logInteraction('Meeting Saved Successfully', { response: response.data });
                onSuccess();
            } else {
                logInteraction('Meeting Save Failed (Success=false)', { response: response.data });
                alert(response.data.message || 'Error al guardar la reunión');
            }
        } catch (err: any) {
            logInteraction('Exception Saving Meeting', {
                error: err.message,
                response: err.response?.data
            });
            console.error('Error saving meeting:', err);
            alert(err.response?.data?.error || err.response?.data?.message || 'Error de conexión');
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            style={{ flex: 1 }}
                        >
                            <option value="">Sin categoría</option>
                            {categories.map(cat => (
                                <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                            ))}
                            <option value="Otros">+ Añadir nuevo tag permanente...</option>
                        </select>
                    </div>
                    {formData.category === 'Otros' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                name="custom_category"
                                placeholder="Escribe el nombre del tag..."
                                value={formData.custom_category}
                                onChange={handleChange}
                                style={{ flex: 1 }}
                                autoFocus
                            />
                            <Button
                                variant="secondary"
                                label={isAddingTag ? "Guardando..." : "Guardar Tag"}
                                onClick={handleAddCategory}
                                type="button"
                                disabled={isAddingTag}
                                style={{ height: '36px' }}
                            />
                        </div>
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
                    label={isSubmitting ? t('reunions.form.creating') : (initialData?.id ? t('common.save') : t('reunions.form.create'))}
                    variant="primary"
                    style={{ flex: 1 }}
                    type="submit"
                    disabled={isSubmitting}
                />
            </div>
        </form>
    );
};

