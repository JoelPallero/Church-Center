import type { FC } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const ChurchEditor: FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        address: '',
        timezone: 'America/Argentina/Buenos_Aires'
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/admin.php?action=create_church', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (result.success) {
                navigate('/churches');
            } else {
                setError(result.error || 'Error al crear la iglesia');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setIsSaving(false);
        }
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleNameChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            name,
            slug: generateSlug(name)
        }));
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
            <header style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Button variant="secondary" onClick={() => navigate('/churches')} style={{ padding: '8px' }}>
                    <span className="material-symbols-outlined">arrow_back</span>
                </Button>
                <h1 className="text-h1">Nueva Iglesia</h1>
            </header>

            <form onSubmit={handleSave}>
                <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {error && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#EF4444',
                            borderRadius: '8px',
                            fontSize: '14px',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-overline" style={{ display: 'block', marginBottom: '8px', color: 'gray' }}>
                            Nombre de la Congregación
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: Cita con la Vida Central"
                            value={formData.name}
                            onChange={e => handleNameChange(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border-subtle)',
                                backgroundColor: 'var(--color-ui-bg)',
                                color: 'var(--color-ui-text)',
                                outline: 'none',
                                fontSize: '16px'
                            }}
                        />
                    </div>

                    <div>
                        <label className="text-overline" style={{ display: 'block', marginBottom: '8px', color: 'gray' }}>
                            URL Única (Slug)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="text-body" style={{ color: 'gray' }}>msm.com/</span>
                            <input
                                type="text"
                                required
                                placeholder="cita-central"
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border-subtle)',
                                    backgroundColor: 'var(--color-ui-bg)',
                                    color: 'var(--color-ui-text)',
                                    outline: 'none',
                                    fontSize: '14px',
                                    fontFamily: 'monospace'
                                }}
                            />
                        </div>
                        <p className="text-overline" style={{ marginTop: '4px', color: '#6B7280', fontSize: '10px' }}>
                            Este será el identificador único para esta iglesia.
                        </p>
                    </div>

                    <div>
                        <label className="text-overline" style={{ display: 'block', marginBottom: '8px', color: 'gray' }}>
                            Dirección Física (Opcional)
                        </label>
                        <textarea
                            placeholder="Calle, Ciudad, País"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border-subtle)',
                                backgroundColor: 'var(--color-ui-bg)',
                                color: 'var(--color-ui-text)',
                                outline: 'none',
                                fontSize: '14px',
                                minHeight: '80px',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{ marginTop: '12px' }}>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={isSaving}
                            style={{ width: '100%', height: '48px' }}
                        >
                            {isSaving ? 'Creando Iglesia...' : 'Confirmar Registro'}
                        </Button>
                    </div>
                </Card>
            </form>

            <section style={{ marginTop: '24px' }}>
                <p className="text-overline" style={{ textAlign: 'center', color: '#6B7280' }}>
                    Al crear una iglesia, se generará una estructura base de ministerios (Alabanza, Sonido, Multimedia) automáticamente.
                </p>
            </section>
        </div>
    );
};
