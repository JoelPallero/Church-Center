import type { FC } from 'react';
import { useState } from 'react';
import { Button } from '../ui/Button';

interface SetlistAssignmentFormProps {
    instanceId: number;
    playlists: any[];
    onSuccess: () => void;
    onCancel: () => void;
}

export const SetlistAssignmentForm: FC<SetlistAssignmentFormProps> = ({ instanceId, playlists, onSuccess, onCancel }) => {
    const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlaylistId) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/calendar.php?action=assign_setlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    meeting_instance_id: instanceId,
                    setlist_id: selectedPlaylistId
                })
            });
            const data = await response.json();
            if (data.success) {
                onSuccess();
            }
        } catch (err) {
            console.error('Error assigning setlist:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="input-field">
                <label className="text-overline">Seleccionar Setlist (Playlist)</label>
                <select
                    value={selectedPlaylistId}
                    onChange={e => setSelectedPlaylistId(e.target.value)}
                    required
                >
                    <option value="">Seleccionar una lista...</option>
                    {playlists.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({new Date(p.created_at).toLocaleDateString()})</option>
                    ))}
                </select>
                <p className="text-body" style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                    Puedes crear nuevas listas en la sección de Canciones.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <Button label="Cancelar" variant="secondary" onClick={onCancel} style={{ flex: 1 }} type="button" />
                <Button
                    label={isSubmitting ? "Asignando..." : "Vincular Setlist"}
                    variant="primary"
                    style={{ flex: 1 }}
                    type="submit"
                    disabled={isSubmitting}
                />
            </div>
        </form>
    );
};
