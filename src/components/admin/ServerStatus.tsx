import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';

interface StatusData {
    main: string;
    music: string;
}

export const ServerStatus: FC = () => {
    const [status, setStatus] = useState<StatusData>({ main: 'checking', music: 'checking' });

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch('/api/admin.php?action=stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.db_status) {
                    setStatus(data.db_status);
                }
            } catch (err) {
                console.error('Error fetching server status:', err);
                setStatus({ main: 'error', music: 'error' });
            }
        };

        fetchStatus();
    }, []);

    return (
        <section style={{ marginBottom: '32px' }}>
            <h2 className="text-h2" style={{ marginBottom: '16px' }}>Estado del Servidor</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <Card style={{
                    padding: '16px',
                    backgroundColor: status.main === 'online' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    border: `1px solid ${status.main === 'online' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span className="material-symbols-outlined" style={{
                        fontSize: '24px',
                        color: status.main === 'online' ? '#10B981' : '#EF4444'
                    }}>
                        {status.main === 'online' ? 'database' : 'database_off'}
                    </span>
                    <div>
                        <p className="text-overline" style={{ color: '#6B7280', fontSize: '10px' }}>BASE PRINCIPAL</p>
                        <span className="text-body" style={{
                            fontWeight: 700,
                            color: status.main === 'online' ? '#10B981' : '#EF4444'
                        }}>
                            {status.main.toUpperCase()}
                        </span>
                    </div>
                </Card>

                <Card style={{
                    padding: '16px',
                    backgroundColor: status.music === 'online' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    border: `1px solid ${status.music === 'online' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span className="material-symbols-outlined" style={{
                        fontSize: '24px',
                        color: status.music === 'online' ? '#3B82F6' : '#EF4444'
                    }}>
                        {status.music === 'online' ? 'library_music' : 'music_off'}
                    </span>
                    <div>
                        <p className="text-overline" style={{ color: '#6B7280', fontSize: '10px' }}>MUSIC CENTER</p>
                        <span className="text-body" style={{
                            fontWeight: 700,
                            color: status.music === 'online' ? '#3B82F6' : '#EF4444'
                        }}>
                            {status.music.toUpperCase()}
                        </span>
                    </div>
                </Card>

                <Card style={{
                    padding: '16px',
                    backgroundColor: 'rgba(139, 92, 246, 0.05)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#8B5CF6' }}>mail</span>
                    <div>
                        <p className="text-overline" style={{ color: '#6B7280', fontSize: '10px' }}>SMTP SERVICE</p>
                        <span className="text-body" style={{ fontWeight: 700, color: '#8B5CF6' }}>
                            ONLINE (Hostinger)
                        </span>
                    </div>
                </Card>
            </div>
        </section>
    );
};
