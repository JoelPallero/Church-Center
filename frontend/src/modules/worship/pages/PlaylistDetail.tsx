import { useState, useEffect, type FC } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { playlistService } from '../../../services/playlistService';
import { useAuth } from '../../../hooks/useAuth';
import type { Playlist, PlaylistItem } from '../../../types/domain';

export const PlaylistDetail: FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, isMaster } = useAuth();
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [loading, setLoading] = useState(true);

    const churchId = searchParams.get('church_id') ? parseInt(searchParams.get('church_id')!) : null;
    const isPastor = user?.role?.name === 'pastor';
    const finalChurchId = churchId || user?.churchId;

    useEffect(() => {
        // Redirigir si no hay contexto de iglesia en absoluto
        if (!finalChurchId && (isPastor || isMaster)) {
            navigate('/mainhub/select-church/playlists');
            return;
        }

        const load = async () => {
            if (id) {
                const data = await playlistService.getById(parseInt(id), finalChurchId || undefined);
                setPlaylist(data);
            }
            setLoading(false);
        };
        load();
    }, [id, finalChurchId, isMaster, isPastor, navigate]);

    if (loading) return <div className="spinner" />;
    if (!playlist) return <div className="p-6 text-center">{t('playlists.notFound') || 'No se encontró el listado.'}</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
            <header>
                <Button
                    variant="secondary"
                    icon="arrow_back"
                    onClick={() => navigate(-1)}
                    label={t('common.back') || 'Volver'}
                />
                <div style={{ marginTop: '16px' }}>
                    <h1 className="text-h1">{playlist.name}</h1>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        {playlist.isSantaCena && (
                            <span style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: '#EF4444',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}>
                                {t('playlists.santaCena')}
                            </span>
                        )}
                        <span className="text-small text-muted" style={{ alignSelf: 'center' }}>
                            {playlist.items.length} {t('playlists.items') || 'canciones'}
                        </span>
                    </div>
                </div>
            </header>

            <Card style={{ padding: '20px' }}>
                <h3 className="text-h2" style={{ marginBottom: '16px' }}>{t('nav.songs')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {playlist.items.length === 0 ? (
                        <p style={{ color: 'gray' }}>{t('playlists.empty')}</p>
                    ) : (
                        playlist.items.map((item: PlaylistItem) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--color-ui-surface)', borderRadius: '12px' }}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>{item.song.title}</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'gray' }}>{item.song.artist} • {t('songs.key')}: {item.songKey}</p>
                                </div>
                                <Button variant="secondary" icon="delete" style={{ color: '#EF4444' }} onClick={() => { }} />
                            </div>
                        ))
                    )}
                    <Button variant="primary" icon="add" label={t('common.add') || 'Agregar Canción'} onClick={() => { }} />
                </div>
            </Card>

            <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="secondary" icon="groups" label={t('nav.teams')} style={{ flex: 1 }} onClick={() => { }} />
                <Button variant="secondary" icon="replay" label={t('playlists.repeat')} style={{ flex: 1 }} onClick={() => { }} />
            </div>
        </div>
    );
};


