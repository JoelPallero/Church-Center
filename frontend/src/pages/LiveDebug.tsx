import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const LiveDebug: FC = () => {
    const [logs, setLogs] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/debug.php', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setLogs(data.logs);
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        let interval: any;
        if (autoRefresh) {
            interval = setInterval(fetchLogs, 3000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                    <h1 className="text-h1">Consola de Debug</h1>
                    <p className="text-body" style={{ color: '#9CA3AF' }}>Monitoreo en vivo del sistema (Producción)</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button
                        variant={autoRefresh ? 'primary' : 'secondary'}
                        label={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    />
                    <Button variant="secondary" label="Limpiar Pantalla" onClick={() => setLogs('')} />
                </div>
            </header>

            <Card style={{
                backgroundColor: '#0F172A',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #1E293B',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    color: '#38BDF8',
                    overflowY: 'auto',
                    flex: 1,
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6'
                }}>
                    {isLoading ? 'Cargando logs...' : logs || 'No hay logs recientes.'}
                </div>
            </Card>

            <div className="flex-center" style={{ gap: '12px', color: '#6B7280' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
                <p className="text-overline">Este archivo se guarda físicamente en la raíz como msm_debug.log</p>
            </div>
        </div>
    );
};
