import { useState, useEffect, type FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { playlistService } from '../../services/playlistService';
import type { Playlist } from '../../types/domain';

export const PlaylistDetail: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (id) {
                const data = await playlistService.getById(parseInt(id));
                setPlaylist(data);
            }
            setLoading(false);
        };
        load();
    }, [id]);

    if (loading) return <div className="spinner" />;
    if (!playlist) return <div>No se encontró el listado.</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <header>
                <Button variant="secondary" icon="arrow_back" onClick={() => navigate(-1)} label="Volver" />
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
                                SANTA CENA
                            </span>
                        )}
                    </div>
                </div>
            </header>

            <Card style={{ padding: '20px' }}>
                <h3 className="text-h2" style={{ marginBottom: '16px' }}>Canciones</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {playlist.items.length === 0 ? (
                        <p style={{ color: 'gray' }}>No hay canciones en este listado.</p>
                    ) : (
                        playlist.items.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--color-ui-surface)', borderRadius: '12px' }}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>{item.song.title}</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'gray' }}>{item.song.artist} • Tono: {item.songKey}</p>
                                </div>
                                <Button variant="secondary" icon="delete" style={{ color: '#EF4444' }} onClick={() => { }} />
                            </div>
                        ))
                    )}
                    <Button variant="primary" icon="add" label="Agregar Canción" onClick={() => { }} />
                </div>
            </Card>

            <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="secondary" icon="groups" label="Ver equipo" style={{ flex: 1 }} onClick={() => { }} />
                <Button variant="secondary" icon="replay" label="Repetir listado" style={{ flex: 1 }} onClick={() => { }} />
            </div>
        </div>
    );
};
