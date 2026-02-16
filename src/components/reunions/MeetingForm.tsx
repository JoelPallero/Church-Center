import type { FC } from 'react';
import { useState } from 'react';
import { Button } from '../ui/Button';

interface MeetingFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export const MeetingForm: FC<MeetingFormProps> = ({ onSuccess, onCancel }) => {
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
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/calendar.php?action=create_meeting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) {
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
            <div className="input-field">
                <label className="text-overline">Título de la Reunión</label>
                <input
                    type="text"
                    name="title"
                    placeholder="Ej: Ensayo General"
                    value={formData.title}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="input-field">
                <label className="text-overline">Descripción (Opcional)</label>
                <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="input-field">
                    <label className="text-overline">Tipo de Reunión</label>
                    <select name="meeting_type" value={formData.meeting_type} onChange={handleChange}>
                        <option value="special">Especial / Unica vez</option>
                        <option value="recurrent">Recurrente semanal</option>
                    </select>
                </div>
                <div className="input-field">
                    <label className="text-overline">Ubicación</label>
                    <input
                        type="text"
                        name="location"
                        placeholder="Ej: Auditorio Principal"
                        value={formData.location}
                        onChange={handleChange}
                    />
                </div>
            </div>

            {formData.meeting_type === 'recurrent' && (
                <div style={{ padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p className="text-overline" style={{ color: 'var(--color-brand-blue)' }}>CONFIGURACIÓN SEMANAL</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div className="input-field">
                            <label className="text-overline">Día</label>
                            <select name="recurrence.day_of_week" value={formData.recurrence.day_of_week} onChange={handleChange}>
                                <option value={0}>Domingo</option>
                                <option value={1}>Lunes</option>
                                <option value={2}>Martes</option>
                                <option value={3}>Miércoles</option>
                                <option value={4}>Jueves</option>
                                <option value={5}>Viernes</option>
                                <option value={6}>Sábado</option>
                            </select>
                        </div>
                        <div className="input-field">
                            <label className="text-overline">Hora Inicio</label>
                            <input
                                type="time"
                                name="recurrence.start_time"
                                value={formData.recurrence.start_time}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="input-field">
                            <label className="text-overline">Hora Fin</label>
                            <input
                                type="time"
                                name="recurrence.end_time"
                                value={formData.recurrence.end_time}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <Button label="Cancelar" variant="secondary" onClick={onCancel} style={{ flex: 1 }} type="button" />
                <Button
                    label={isSubmitting ? "Creando..." : "Crear Reunión"}
                    variant="primary"
                    style={{ flex: 1 }}
                    type="submit"
                    disabled={isSubmitting}
                />
            </div>
        </form>
    );
};
