import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const ChurchList: FC = () => {
    const navigate = useNavigate();
    const [churches, setChurches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchChurches();
    }, []);

    const fetchChurches = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/admin.php?action=churches', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setChurches(data);
        } catch (err) {
            console.error('Error fetching churches:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredChurches = churches.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <header style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h1 className="text-h1">Iglesias</h1>
                    <Button
                        variant="primary"
                        icon="add"
                        label="Nueva Iglesia"
                        onClick={() => navigate('/churches/new')}
                    />
                </div>

                <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <span className="material-symbols-outlined" style={{
                            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'gray'
                        }}>search</span>
                        <input
                            type="text"
                            placeholder="Buscar iglesias..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border-subtle)',
                                backgroundColor: 'var(--color-ui-bg)',
                                color: 'var(--color-ui-text)',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ padding: '0 12px' }}
                    >
                        <span className="material-symbols-outlined">filter_list</span>
                    </Button>
                </div>

                {showFilters && (
                    <Card style={{ padding: '16px' }}>
                        <p className="text-overline" style={{ color: 'gray' }}>Próximamente: Filtros avanzados por región o estado.</p>
                    </Card>
                )}
            </header>

            <div style={{ display: 'grid', gap: '12px' }}>
                {isLoading ? (
                    <div className="flex-center" style={{ height: '200px' }}>
                        <div className="spinner" />
                    </div>
                ) : filteredChurches.length === 0 ? (
                    <p className="text-body" style={{ textAlign: 'center', color: 'gray', marginTop: '40px' }}>No se encontraron iglesias.</p>
                ) : (
                    filteredChurches.map(church => (
                        <Card key={church.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--color-brand-blue)'
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>church</span>
                                </div>
                                <div>
                                    <h3 className="text-card-title">{church.name}</h3>
                                    <p className="text-overline" style={{ color: 'gray', marginTop: '4px' }}>/{church.slug}</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined" style={{ color: '#4B5563' }}>chevron_right</span>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
