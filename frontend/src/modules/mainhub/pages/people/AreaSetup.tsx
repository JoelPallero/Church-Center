import type { FC } from 'react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';

export const AreaSetup: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const churchId = searchParams.get('church_id');
    const [areas, setAreas] = useState<string[]>(['']);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleAddArea = () => setAreas([...areas, '']);

    const handleRemoveArea = (index: number) => {
        if (areas.length > 1) {
            setAreas(areas.filter((_, i) => i !== index));
        }
    };

    const handleAreaChange = (index: number, value: string) => {
        const newAreas = [...areas];
        newAreas[index] = value;
        setAreas(newAreas);
    };

    const handleContinue = async () => {
        const validAreas = areas.filter(a => a.trim().length > 0);
        if (validAreas.length === 0) {
            setError(t('setup.areas.errorEmpty'));
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const token = localStorage.getItem('auth_token');
            for (const areaName of validAreas) {
                const response = await fetch(`/api/areas${churchId ? `?church_id=${churchId}` : ''}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ name: areaName })
                });

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message);
                }
            }
            navigate(`/mainhub/setup-teams${churchId ? `?church_id=${churchId}` : ''}`);
        } catch (err: any) {
            setError(err.message || t('setup.areas.errorDelay'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
            <header style={{ marginBottom: '24px' }}>
                <h1 className="text-h1">{t('setup.areas.title')}</h1>
                <p className="text-body" style={{ color: 'gray' }}>{t('setup.areas.subtitle')}</p>
            </header>

            <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {error && (
                    <div style={{
                        padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
                        borderRadius: '8px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {areas.map((area, index) => (
                        <div key={index} style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                placeholder={t('setup.areas.placeholder')}
                                value={area}
                                onChange={e => handleAreaChange(index, e.target.value)}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px',
                                    border: '1px solid var(--color-border-subtle)',
                                    backgroundColor: 'var(--color-ui-bg)', color: 'var(--color-ui-text)',
                                    outline: 'none', fontSize: '16px'
                                }}
                            />
                            {areas.length > 1 && (
                                <Button variant="secondary" onClick={() => handleRemoveArea(index)} style={{ padding: '8px' }}>
                                    <span className="material-symbols-outlined">delete</span>
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                <Button variant="ghost" icon="add" label={t('setup.areas.addAction')} onClick={handleAddArea} />

                <div style={{ marginTop: '12px' }}>
                    <Button
                        variant="primary"
                        onClick={handleContinue}
                        disabled={isSaving}
                        style={{ width: '100%', height: '48px' }}
                    >
                        {isSaving ? t('setup.areas.saving') : t('setup.areas.continue')}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
