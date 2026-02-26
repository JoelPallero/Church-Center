import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { useAuth } from '../../../../hooks/useAuth';

export const AreaList: FC = () => {
    const { t } = useTranslation();
    const { isMaster } = useAuth();
    const [areas, setAreas] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingArea, setEditingArea] = useState<any>(null);
    const [newName, setNewName] = useState('');
    const [showNewForm, setShowNewForm] = useState(false);
    const [selectedChurchId, setSelectedChurchId] = useState<string>('');
    const [churches, setChurches] = useState<any[]>([]);

    useEffect(() => {
        fetchChurches();
        fetchAreas();
    }, [selectedChurchId]);

    const fetchChurches = async () => {
        if (!isMaster) return;
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/churches', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) setChurches(result.churches || []);
        } catch (err) {
            console.error('Error fetching churches:', err);
        }
    };

    const fetchAreas = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const url = selectedChurchId ? `/api/areas?church_id=${selectedChurchId}` : '/api/areas';
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setAreas(result.areas || []);
            }
        } catch (err) {
            console.error('Error fetching areas:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || (!selectedChurchId && !editingArea)) return;

        try {
            const token = localStorage.getItem('auth_token');
            const url = editingArea ? `/api/areas/${editingArea.id}` : `/api/areas?church_id=${selectedChurchId}`;
            const method = editingArea ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName })
            });

            const result = await response.json();
            if (result.success) {
                setNewName('');
                setEditingArea(null);
                setShowNewForm(false);
                fetchAreas();
            }
        } catch (err) {
            console.error('Error saving area:', err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(t('common.confirmDelete') || '¿Estás seguro?')) return;
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/areas/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) fetchAreas();
        } catch (err) {
            console.error('Error deleting area:', err);
        }
    };

    return (
        <div>
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="text-h1">{t('nav.areas')}</h1>
                    <p className="text-body" style={{ color: 'gray' }}>Gestión independiente de áreas y departamentos.</p>
                </div>
                <Button
                    variant="primary"
                    icon="add"
                    label={t('common.add') || 'Añadir'}
                    onClick={() => {
                        setEditingArea(null);
                        setNewName('');
                        setShowNewForm(true);
                    }}
                />
            </header>

            {isMaster && (
                <div style={{ marginBottom: '20px' }}>
                    <label className="text-overline" style={{ display: 'block', marginBottom: '8px' }}>Filtrar por Iglesia</label>
                    <select
                        value={selectedChurchId}
                        onChange={e => setSelectedChurchId(e.target.value)}
                        className="w-full"
                        style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--color-border-subtle)' }}
                    >
                        <option value="">Todas las iglesias</option>
                        {churches.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {(showNewForm || editingArea) && (
                <Card style={{ padding: '20px', marginBottom: '24px' }}>
                    <form onSubmit={handleSave} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '8px' }}>
                                {editingArea ? 'Editar Área' : 'Nueva Área'}
                            </label>
                            <input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="Nombre del área (ej. Alabanza)"
                                required
                                className="w-full"
                            />
                        </div>
                        <Button type="button" variant="secondary" label={t('common.cancel')} onClick={() => { setShowNewForm(false); setEditingArea(null); }} />
                        <Button type="submit" variant="primary" label={t('common.save')} />
                    </form>
                </Card>
            )}

            <div style={{ display: 'grid', gap: '12px' }}>
                {isLoading ? (
                    <div className="flex-center" style={{ height: '100px' }}><div className="spinner" /></div>
                ) : areas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'gray', padding: '40px' }}>No hay áreas registradas.</p>
                ) : (
                    areas.map(area => (
                        <Card key={area.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
                            <div>
                                <h3 className="text-card-title">{area.name}</h3>
                                {area.church_name && <p className="text-overline" style={{ color: 'gray' }}>{area.church_name}</p>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => { setEditingArea(area); setNewName(area.name); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                                </button>
                                <button
                                    onClick={() => handleDelete(area.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                                </button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
