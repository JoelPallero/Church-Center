import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { useToast } from '../../../../context/ToastContext';

export const ChurchEditor: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const { addToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        address: '',
        timezone: 'America/Argentina/Buenos_Aires'
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingServices, setIsSavingServices] = useState(false);
    const [services, setServices] = useState<any[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            fetchChurch();
            fetchServices();
        }
    }, [id]);

    const fetchChurch = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/churches/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setFormData({
                    name: result.church.name,
                    slug: result.church.slug,
                    address: result.church.address || '',
                    timezone: result.church.timezone || 'America/Argentina/Buenos_Aires'
                });
            } else {
                setError(result.error || 'Error al cargar iglesia');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/churches/${id}/services`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setServices(result.services);
            }
        } catch (err) {
            console.error('Error fetching services:', err);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            const token = localStorage.getItem('auth_token');
            const url = id ? `/api/churches/${id}` : '/api/churches';
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            if (result.success) {
                if (id) {
                    // Update services too
                    await handleSaveServices();
                    addToast(t('churches.updateSuccess') || 'Iglesia actualizada correctamente', 'success');
                    navigate('/mainhub/churches');
                } else {
                    // Redirect to Step 2: Area Setup
                    navigate(`/mainhub/setup-areas?church_id=${result.id}`);
                }
            } else {
                setError(result.error || (id ? 'Error al actualizar' : t('setup.church.errorCreate')));
            }
        } catch (err) {
            setError(t('setup.church.errorConnection'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveServices = async () => {
        setIsSavingServices(true);
        try {
            const token = localStorage.getItem('auth_token');
            await fetch(`/api/churches/${id}/services`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ services })
            });
        } catch (err) {
            console.error('Error saving services:', err);
        } finally {
            setIsSavingServices(false);
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
                <Button variant="secondary" onClick={() => navigate('/mainhub/churches')} style={{ padding: '8px' }}>
                    <span className="material-symbols-outlined">arrow_back</span>
                </Button>
                <h1 className="text-h1">{id ? 'Editar Iglesia' : t('setup.church.title')}</h1>
            </header>

            {isLoading ? (
                <Card style={{ padding: '40px', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                </Card>
            ) : (
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
                                {t('setup.church.nameLabel')}
                            </label>
                            <input
                                type="text"
                                required
                                placeholder={t('setup.church.namePlaceholder')}
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
                                {t('setup.church.slugLabel')}
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
                                {t('setup.church.slugHint')}
                            </p>
                        </div>

                        <div>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '8px', color: 'gray' }}>
                                {t('setup.church.addressLabel')}
                            </label>
                            <textarea
                                placeholder={t('setup.church.addressPlaceholder')}
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
                                disabled={isSaving || isSavingServices}
                                style={{ width: '100%', height: '48px' }}
                            >
                                {(isSaving || isSavingServices) ? t('setup.church.saving') : t('setup.church.submit')}
                            </Button>
                        </div>
                    </Card>

                    {id && services.length > 0 && (
                        <Card style={{ padding: '24px', marginTop: '24px' }}>
                            <h3 className="text-overline" style={{ color: 'var(--color-brand-blue)', marginBottom: '16px', letterSpacing: '1px', fontWeight: 700 }}>
                                {t('churches.hubsActivation') || 'Activación de Hubs'}
                            </h3>
                            <p className="text-body-secondary" style={{ fontSize: '12px', marginBottom: '20px' }}>
                                {t('churches.hubsHint') || 'Activa o desactiva los módulos disponibles para esta iglesia. Esto ocultará menús y funciones para todos sus usuarios.'}
                            </p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {services.map(svc => (
                                    <div key={svc.id} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        backgroundColor: 'var(--color-ui-bg-alt)',
                                        border: '1px solid var(--color-border-subtle)'
                                    }}>
                                        <div>
                                            <p className="text-body-strong" style={{ margin: 0 }}>{svc.name}</p>
                                            <p className="text-overline" style={{ margin: 0, opacity: 0.6, fontSize: '10px' }}>{svc.key}</p>
                                        </div>
                                        <div 
                                            onClick={() => {
                                                setServices(prev => prev.map(s => s.id === svc.id ? { ...s, is_enabled: s.is_enabled ? 0 : 1 } : s));
                                            }}
                                            style={{
                                                width: '44px',
                                                height: '24px',
                                                borderRadius: '12px',
                                                backgroundColor: svc.is_enabled ? 'var(--color-brand-blue)' : '#D1D5DB',
                                                position: 'relative',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <div style={{
                                                width: '18px',
                                                height: '18px',
                                                borderRadius: '50%',
                                                backgroundColor: 'white',
                                                position: 'absolute',
                                                top: '3px',
                                                left: svc.is_enabled ? '23px' : '3px',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </form>
            )}

            {!id && (
                <section style={{ marginTop: '24px' }}>
                    <p className="text-overline" style={{ textAlign: 'center', color: '#6B7280' }}>
                        {t('setup.church.notice')}
                    </p>
                </section>
            )}
        </div>
    );
};



