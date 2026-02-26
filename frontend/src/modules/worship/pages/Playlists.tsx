import { useState, useEffect, type FC } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { playlistService } from '../../../services/playlistService';
import { reunionService } from '../../../services/reunionService';
import { useAuth } from '../../../hooks/useAuth';
import type { Playlist } from '../../../types/domain';

export const Playlists: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, isMaster } = useAuth();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [reunionsCount, setReunionsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const churchId = searchParams.get('church_id') ? parseInt(searchParams.get('church_id')!) : null;
    const isPastor = user?.role?.name === 'pastor';
    const profileChurchId = user?.churchId;
    const finalChurchId = churchId || profileChurchId;

    useEffect(() => {
        // Redirect if no church context at all and user is Pastor or Master (multitenant)
        if (!finalChurchId && (isPastor || isMaster)) {
            navigate('/mainhub/select-church/playlists');
            return;
        }

        const loadData = async () => {
            setLoading(true);
            const [fetchedPlaylists, upcomingReunions] = await Promise.all([
                playlistService.getAll(finalChurchId || undefined),
                reunionService.getUpcoming()
            ]);
            setPlaylists(fetchedPlaylists);
            setReunionsCount(upcomingReunions.length);
            setLoading(false);
        };
        loadData();
    }, [finalChurchId, isMaster, isPastor, navigate]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#10B981'; // Green
            case 'in_progress': return '#3B82F6'; // Blue
            default: return '#F59E0B'; // Orange
        }
    };

    const isLeader = user?.role?.name === 'leader' || user?.role?.name === 'coordinator';

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '300px' }}>
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="text-h1">{t('playlists.title')}</h1>
                    <p className="text-body text-muted">{t('playlists.description')}</p>
                </div>
                {reunionsCount === 0 ? (
                    <Button
                        label={t('playlists.createReunion')}
                        icon="add"
                        onClick={() => navigate('/reunions')}
                    />
                ) : (
                    <Button
                        label={t('playlists.newPlaylist')}
                        icon="playlist_add"
                        onClick={() => { }}
                    />
                )}
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {playlists.length === 0 ? (
                    <Card style={{ padding: '40px', textAlign: 'center' }}>
                        <p className="text-muted">{t('playlists.empty')}</p>
                    </Card>
                ) : (
                    playlists.map(p => (
                        <Card key={p.id} style={{ padding: '20px', position: 'relative' }}>
                            <div className="card-header">
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        backgroundColor: getStatusColor(p.status)
                                    }} />
                                    <div>
                                        <h3 className="text-h2" style={{ margin: 0 }}>{p.name}</h3>
                                        <p className="text-small text-muted" style={{ margin: '2px 0' }}>
                                            {t(`playlists.status.${p.status}`)}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {p.isSantaCena && (
                                        <span style={{
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            color: '#EF4444',
                                            padding: '4px 8px',
                                            borderRadius: '8px',
                                            fontSize: '10px',
                                            fontWeight: 'bold'
                                        }}>
                                            {t('playlists.santaCena')}
                                        </span>
                                    )}
                                    <span className="material-symbols-outlined text-muted" style={{ cursor: 'pointer' }}>more_vert</span>
                                </div>
                            </div>

                            <div className="card-actions">
                                <Button
                                    variant="secondary"
                                    style={{ flex: 1 }}
                                    icon="visibility"
                                    label={t('playlists.view')}
                                    onClick={() => navigate(`/playlists/${p.id}`)}
                                />
                                {isLeader && (
                                    <Button
                                        variant="secondary"
                                        style={{ flex: 1 }}
                                        icon="replay"
                                        label={t('playlists.repeat')}
                                        onClick={() => { }}
                                    />
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};


