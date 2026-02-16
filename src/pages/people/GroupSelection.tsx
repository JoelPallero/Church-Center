import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { peopleService } from '../../services/peopleService';
import { InstrumentForm } from '../../components/people/InstrumentForm';

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
            navigate('/');
        }
    };

    if (loading) return <div className="flex-center" style={{ height: '80vh' }}>Cargando grupos...</div>;

    if (showInstruments) {
        return (
            <div className="flex-center" style={{ minHeight: '80vh', padding: '24px' }}>
                <InstrumentForm onComplete={() => navigate('/')} />
            </div>
        );
    }

    return (
        <div className="flex-center" style={{ minHeight: '80vh', padding: '24px' }}>
            <Card style={{ maxWidth: '600px', width: '100%', padding: '32px' }}>
                <h1 className="text-h1" style={{ marginBottom: '8px' }}>Unirse a Equipos</h1>
                <p className="text-body" style={{ color: 'gray', marginBottom: '24px' }}>
                    Selecciona los ministerios o áreas en las que vas a participar.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '32px' }}>
                    {groups.map(g => (
                        <div
                            key={g.id}
                            onClick={() => toggleGroup(g.id)}
                            style={{
                                padding: '16px',
                                borderRadius: '12px',
                                border: '2px solid ' + (selectedGroups.includes(g.id) ? 'var(--color-brand-blue)' : 'var(--color-border-subtle)'),
                                backgroundColor: selectedGroups.includes(g.id) ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-ui-bg)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }}
                        >
                            <span className="text-card-title">{g.name}</span>
                            {g.description && <span style={{ fontSize: '11px', color: 'gray' }}>{g.description}</span>}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <Button variant="ghost" label="Omitir por ahora" onClick={() => navigate('/')} />
                    <Button variant="primary" label="Continuar" onClick={handleContinue} />
                </div>
            </Card>
        </div>
    );
};
