import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { peopleService } from '../../services/peopleService';

interface Props {
    onComplete: () => void;
    initialSelected?: number[];
}

export const InstrumentForm: FC<Props> = ({ onComplete, initialSelected = [] }) => {
    const [instruments, setInstruments] = useState<any[]>([]);
    const [selected, setSelected] = useState<number[]>(initialSelected);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInstruments();
    }, []);

    const loadInstruments = async () => {
        const data = await peopleService.getInstruments();
        setInstruments(data);
        setLoading(false);
    };

    const toggleInstrument = (id: number) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(iid => iid !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        const success = await peopleService.saveInstruments(selected);
        if (success) {
            onComplete();
        } else {
            alert('Error al guardar instrumentos.');
        }
    };

    if (loading) return <div>Cargando instrumentos...</div>;

    // Group by category
    const categories = Array.from(new Set(instruments.map(i => i.category)));

    return (
        <Card style={{ maxWidth: '500px', width: '100%', padding: '24px' }}>
            <h2 className="text-h2" style={{ marginBottom: '8px' }}>Tus Instrumentos</h2>
            <p className="text-body" style={{ color: 'gray', marginBottom: '24px' }}>
                Indica qué instrumentos tocas o si eres cantante.
            </p>

            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '24px', paddingRight: '10px' }}>
                {categories.map(cat => (
                    <div key={cat} style={{ marginBottom: '16px' }}>
                        <h3 className="text-overline" style={{ color: 'var(--color-primary)', marginBottom: '8px' }}>
                            {cat ? cat.toUpperCase() : 'OTROS'}
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {instruments.filter(i => i.category === cat).map(i => (
                                <button
                                    key={i.id}
                                    onClick={() => toggleInstrument(i.id)}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '20px',
                                        border: '1px solid ' + (selected.includes(i.id) ? 'var(--color-brand-blue)' : 'var(--color-border-subtle)'),
                                        backgroundColor: selected.includes(i.id) ? 'var(--color-brand-blue)' : 'transparent',
                                        color: selected.includes(i.id) ? 'white' : 'var(--color-ui-text)',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {i.name}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button variant="ghost" label="Cancelar" onClick={onComplete} />
                <Button variant="primary" label="Guardar y Finalizar" onClick={handleSave} />
            </div>
        </Card>
    );
};
