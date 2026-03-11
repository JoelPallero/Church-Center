import { useState, useEffect, type FC } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { playlistService } from '../../../services/playlistService';
import { songService } from '../../../services/songService';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../context/ToastContext';
import type { Song, Playlist, PlaylistItem } from '../../../types/domain';
import { musicUtils } from '../../../utils/musicUtils';

export const PlaylistDetail: FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, isMaster, hasRole } = useAuth();
    const { addToast } = useToast();
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [allSongs, setAllSongs] = useState<Song[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    const handleShare = () => {
        const shareUrl = window.location.href;
        navigator.clipboard.writeText(shareUrl);
        addToast('Enlace de listado copiado al portapapeles', 'success');
    };

    const churchId = searchParams.get('church_id') ? parseInt(searchParams.get('church_id')!) : null;
    const isPastor = hasRole('pastor');
    const finalChurchId = churchId || user?.churchId;

    const reloadPlaylist = async () => {
        if (id) {
            const data = await playlistService.getById(parseInt(id), finalChurchId || undefined);
            setPlaylist(data);
        }
    };

    const handleRemoveSong = async (songId: number | string) => {
        if (!playlist || !id) return;
        const success = await playlistService.removeSong(parseInt(id), parseInt(songId.toString()));
        if (success) {
            reloadPlaylist();
            addToast('Canción removida del listado', 'success');
        }
    };

    const handleAddSong = async (songId: number | string) => {
        if (!playlist || !id) return;
        setIsAdding(true);
        try {
            const success = await playlistService.addSong(parseInt(id), parseInt(songId.toString()), playlist.items.length);
            if (success) {
                reloadPlaylist();
                setIsModalOpen(false);
                addToast('Canción agregada al listado', 'success');
            }
        } finally {
            setIsAdding(false);
        }
    };

    const openAddModal = async () => {
        setIsModalOpen(true);
        const songsData = await songService.getAll(finalChurchId || undefined);
        setAllSongs(songsData);
    };

    useEffect(() => {
        // Redirigir si no hay contexto de iglesia en absoluto
        if (!finalChurchId && (isPastor || isMaster)) {
            navigate('/mainhub/select-church/playlists');
            return;
        }

        const load = async () => {
            await reloadPlaylist();
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
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
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
                    <Button
                        variant="secondary"
                        icon="ios_share"
                        label="Compartir"
                        onClick={handleShare}
                    />
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
                                    <p style={{ margin: 0, fontSize: '12px', color: 'gray' }}>{item.song.artist} • {t('songs.key')}: {musicUtils.formatKey(item.songKey || '')}</p>
                                </div>
                                <Button variant="secondary" icon="delete" style={{ color: '#EF4444' }} onClick={() => handleRemoveSong(item.song.id)} />
                            </div>
                        ))
                    )}
                    <Button variant="primary" icon="add" label={t('common.add') || 'Agregar Canción'} onClick={openAddModal} />
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Agregar Canción"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto', minWidth: '350px' }}>
                    {allSongs.length === 0 && <p className="text-center">Cargando canciones...</p>}
                    {allSongs.map(song => (
                        <div
                            key={song.id}
                            className="list-item-hover"
                            onClick={() => !isAdding && handleAddSong(song.id)}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px',
                                borderRadius: '12px',
                                backgroundColor: 'var(--color-ui-bg)',
                                cursor: 'pointer',
                                opacity: isAdding ? 0.5 : 1
                            }}
                        >
                            <div>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>{song.title}</p>
                                <p style={{ margin: 0, fontSize: '12px', color: 'gray' }}>{song.artist}</p>
                            </div>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)' }}>add_circle</span>
                        </div>
                    ))}
                </div>
            </Modal>

            <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="secondary" icon="groups" label={t('nav.teams')} style={{ flex: 1 }} onClick={() => { }} />
                <Button variant="secondary" icon="replay" label={t('playlists.repeat')} style={{ flex: 1 }} onClick={() => { }} />
            </div>
        </div>
    );
};


