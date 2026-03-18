import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { peopleService } from '../../../../services/peopleService';
import { InstrumentForm } from '../../../../components/people/InstrumentForm';

export const GroupSelection: FC = () => {
    useTranslation();
    const navigate = useNavigate();
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
    const [showInstruments, setShowInstruments] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        const data = await peopleService.getGroups();
        setGroups(data);
        setLoading(false);
    };

    const toggleGroup = (id: number) => {
        setSelectedGroups(prev =>
            prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]
        );
    };

    const handleContinue = async () => {
        if (selectedGroups.length === 0) {
            alert('Por favor selecciona al menos un grupo.');
            return;
        }

        // Save selected groups
        for (const gid of selectedGroups) {
            await peopleService.joinGroup(gid);
        }

        // If "Alabanza" or "Musica" is selected, show instrument form
        const musicGroup = groups.find(g =>
            g.name.toLowerCase().includes('alabanza') ||
            g.name.toLowerCase().includes('musica')
        );

        if (musicGroup && selectedGroups.includes(musicGroup.id)) {
            setShowInstruments(true);
        } else {
            navigate('/dashboard');
        }
    };

    if (loading) return <div className="flex-center" style={{ height: '80vh' }}>Cargando grupos...</div>;

    if (showInstruments) {
        return (
            <div className="flex-center" style={{ minHeight: '80vh', padding: '24px' }}>
                <InstrumentForm onComplete={() => navigate('/dashboard')} />
            </div>
        );
    }

    return (
        <div className="flex-center" style={{ minHeight: '80vh', padding: '24px' }}>
            <Card style={{ maxWidth: '800px', width: '100%', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 className="text-h1" style={{ marginBottom: '12px' }}>Unirse a Equipos</h1>
                    <p className="text-body-secondary" style={{ maxWidth: '420px', margin: '0 auto' }}>
                        Selecciona los ministerios o áreas en las que vas a participar para personalizar tu experiencia.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '12px',
                    marginBottom: '40px'
                }}>
                    {groups.map(g => (
                        <div
                            key={g.id}
                            onClick={() => toggleGroup(g.id)}
                            style={{
                                padding: '24px',
                                borderRadius: '20px',
                                border: '2px solid ' + (selectedGroups.includes(g.id) ? 'var(--color-brand-blue)' : 'var(--color-border-subtle)'),
                                backgroundColor: selectedGroups.includes(g.id) ? 'rgba(59, 130, 246, 0.05)' : 'var(--color-ui-bg)',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                gap: '8px',
                                position: 'relative'
                            }}
                            className="sidebar-item"
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '14px',
                                backgroundColor: selectedGroups.includes(g.id) ? 'var(--color-brand-blue)' : 'rgba(255,255,255,0.05)',
                                color: selectedGroups.includes(g.id) ? 'white' : 'var(--color-brand-blue)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '4px',
                                transition: 'all 0.2s'
                            }}>
                                <span className="material-symbols-outlined">group</span>
                            </div>
                            <span className="text-card-title" style={{ fontWeight: 700 }}>{g.name}</span>
                            {g.description && <span style={{ fontSize: '11px', color: 'var(--color-ui-text-soft)', lineHeight: '1.4' }}>{g.description}</span>}

                            {selectedGroups.includes(g.id) && (
                                <div style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--color-brand-blue)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px', fontWeight: 'bold' }}>check</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <Button variant="ghost" label="Omitir por ahora" onClick={() => navigate('/dashboard')} style={{ height: '48px', padding: '0 24px' }} />
                    <Button variant="primary" label="Comenzar ahora" onClick={handleContinue} style={{ height: '48px', padding: '0 40px' }} />
                </div>
            </Card>
        </div>

    );
};



