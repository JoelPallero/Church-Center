import type { FC } from 'react';
import { useState } from 'react';
import { Button } from '../ui/Button';

interface AssignmentFormProps {
    instanceId: number;
    members: any[];
    instruments: any[];
    onSuccess: () => void;
    onCancel: () => void;
}

export const AssignmentForm: FC<AssignmentFormProps> = ({ instanceId, members, instruments, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        member_id: '',
        role: '',
        instrument_id: '',
        is_replacement: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/calendar.php?action=assign_team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    meeting_instance_id: instanceId,
                    ...formData
                })
            });
            const data = await response.json();
            if (data.success) {
                onSuccess();
            }
        } catch (err) {
            console.error('Error assigning member:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="input-field">
                <label className="text-overline">Miembro</label>
                <select
                    value={formData.member_id}
                    onChange={e => setFormData({ ...formData, member_id: e.target.value })}
                    required
                >
                    <option value="">Seleccionar miembro...</option>
                    {members.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.role_name})</option>
                    ))}
                </select>
            </div>

            <div className="input-field">
                <label className="text-overline">Rol en la reunión</label>
                <input
                    type="text"
                    placeholder="Ej: Director de Alabanza"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    required
                />
            </div>

            <div className="input-field">
                <label className="text-overline">Instrumento (Opcional)</label>
                <select
                    value={formData.instrument_id}
                    onChange={e => setFormData({ ...formData, instrument_id: e.target.value })}
                >
                    <option value="">Ninguno</option>
                    {instruments.map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                    type="checkbox"
                    id="is_replacement"
                    checked={formData.is_replacement}
                    onChange={e => setFormData({ ...formData, is_replacement: e.target.checked })}
                />
                <label htmlFor="is_replacement" className="text-body" style={{ fontSize: '14px' }}>Es un reemplazo</label>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <Button label="Cancelar" variant="secondary" onClick={onCancel} style={{ flex: 1 }} type="button" />
                <Button
                    label={isSubmitting ? "Asignando..." : "Asignar"}
                    variant="primary"
                    style={{ flex: 1 }}
                    type="submit"
                    disabled={isSubmitting}
                />
            </div>
        </form>
    );
};
