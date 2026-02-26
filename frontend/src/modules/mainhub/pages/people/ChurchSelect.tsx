import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { useAuth } from '../../../../hooks/useAuth';

export const ChurchSelect: FC = () => {
    const { target } = useParams<{ target: string }>();
    const navigate = useNavigate();
    const { isMaster } = useAuth();
    const [churches, setChurches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMyChurches();
    }, []);

    const fetchMyChurches = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/churches?action=my_churches', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                if (data.churches.length === 1) {
                    // Auto-redirect if only one church
                    redirectToTarget(data.churches[0].id);
                } else if (data.churches.length === 0) {
                    if (isMaster) {
                        // For Master, 0 churches is an invitation to create one
                        setChurches([]);
                    } else {
                        setError('No tienes iglesias asociadas.');
                    }
                } else {
                    setChurches(data.churches);
                }
            } else {
                setError(data.message || 'Error al cargar iglesias.');
            }
        } catch (err) {
            setError('Estamos presentando demoras en el servicio, intentelo más tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    const redirectToTarget = (churchId: number) => {
        let path = '/';
        if (target === 'teams') path = `/mainhub/teams?church_id=${churchId}`;
        else if (target === 'areas') path = `/mainhub/setup-areas?church_id=${churchId}`;
        else if (target === 'songs') path = `/worship/songs?church_id=${churchId}`;
        // Add more targets as needed

        navigate(path);
    };

    if (isLoading) return <div className="flex-center" style={{ height: '300px' }}><div className="spinner" /></div>;

    return (
        <div style={{ maxWidth: '500px', margin: '40px auto', padding: '0 20px' }}>
            <header style={{ marginBottom: '24px', textAlign: 'center' }}>
                <h1 className="text-h1">Seleccionar Iglesia</h1>
                <p className="text-body" style={{ color: 'gray' }}>Parece que perteneces a múltiples iglesias. Por favor selecciona una para continuar.</p>
            </header>

            {error && (
                <Card style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    {error}
                </Card>
            )}

            {churches.length > 0 ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                    {churches.map(church => (
                        <Card
                            key={church.id}
                            onClick={() => redirectToTarget(church.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '16px', padding: '20px',
                                cursor: 'pointer', transition: 'transform 0.2s'
                            }}
                        >
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand-blue)'
                            }}>
                                <span className="material-symbols-outlined">church</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 className="text-card-title">{church.name}</h3>
                                <p className="text-overline" style={{ color: 'gray' }}>/{church.slug}</p>
                            </div>
                            <span className="material-symbols-outlined" style={{ color: 'gray' }}>chevron_right</span>
                        </Card>
                    ))}
                </div>
            ) : isMaster && !error ? (
                <Card style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '20px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand-blue)'
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>add_business</span>
                    </div>
                    <div>
                        <h3 className="text-h3">No hay iglesias registradas</h3>
                        <p className="text-body" style={{ color: 'gray', marginTop: '4px' }}>Para configurar equipos o ver reportes, primero debes crear una iglesia.</p>
                    </div>
                    <Button
                        variant="primary"
                        label="Crear mi primera iglesia"
                        icon="add"
                        onClick={() => navigate('/mainhub/churches/new')}
                    />
                </Card>
            ) : null}

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <Button variant="ghost" label="Volver al Inicio" onClick={() => navigate('/')} />
            </div>
        </div>
    );
};
