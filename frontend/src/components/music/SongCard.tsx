import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Metronome } from './Metronome';
import { useAuth } from '../../hooks/useAuth';
import type { Song } from '../../services/songService';
import { type FC, type MouseEvent } from 'react';
import { musicUtils } from '../../utils/musicUtils';

interface SongCardProps {
    song: Song & { isAssigned?: boolean; singerName?: string };
    singerIdFilter?: number | null;
    onDelete?: (id: number | string) => void;
}

export const SongCard: FC<SongCardProps> = ({ song, singerIdFilter, onDelete }) => {
    const { canManageSongs, isMaster } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const churchId = searchParams.get('church_id');

    const buildUrl = (path: string) => {
        const params = new URLSearchParams();
        if (churchId) params.set('church_id', churchId);
        if (singerIdFilter) params.set('singer', singerIdFilter.toString());
        const queryString = params.toString();
        return path + (queryString ? `?${queryString}` : '');
    };

    return (
        <Card
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px', // Compact padding (side padding increased, top/bottom reduced)
                cursor: 'pointer',
                borderLeft: song.isAssigned ? '4px solid var(--color-brand-blue)' : 'none',
                transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onClick={() => navigate(buildUrl(`/worship/songs/${song.id}`))}
        >
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1px' }}>
                    <h3 className="text-card-title" style={{ margin: 0, fontSize: '15px' }}>{song.title}</h3>
                    {song.isAssigned && (
                        <span className="text-overline" style={{ color: 'var(--color-brand-blue)', fontWeight: 'bold', fontSize: '10px', marginTop: '2px' }}>
                            ({song.singerName})
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <p className="text-overline text-muted" style={{ margin: 0, fontSize: '11px', fontWeight: 600 }}>{song.artist}</p>
                    {song.originalKey && (
                        <span style={{
                            backgroundColor: 'rgba(63, 108, 222, 0.12)',
                            color: 'var(--color-brand-blue)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 800,
                            fontSize: '10px',
                            lineHeight: 1
                        }}>
                            {musicUtils.formatKey(song.originalKey, 'spanish')}
                        </span>
                    )}
                    <span className="text-overline" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-ui-text-soft)', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>speed</span>
                        {song.tempo}
                    </span>
                    {isMaster && song.churchName && (
                        <div style={{
                            fontSize: '9px',
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            color: 'var(--color-brand-blue)',
                            padding: '0px 6px',
                            borderRadius: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase'
                        }}>
                            {song.churchName}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {song.tempo && Number(song.tempo) > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Metronome bpm={Number(song.tempo)} variant="card" />
                    </div>
                )}

                {canManageSongs && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                        <Button
                            variant="ghost"
                            icon="edit"
                            onClick={(e: MouseEvent) => {
                                e.stopPropagation();
                                navigate(buildUrl(`/worship/songs/${song.id}/edit`));
                            }}
                            style={{ padding: '6px', minWidth: 'auto', height: '36px', width: '36px', borderRadius: '50%', color: 'var(--color-brand-blue)' }}
                        />
                        <Button
                            variant="ghost"
                            icon="delete"
                            onClick={(e: MouseEvent) => {
                                e.stopPropagation();
                                if (window.confirm('¿Eliminar esta canción?')) {
                                    onDelete?.(song.id);
                                }
                            }}
                            style={{ padding: '6px', minWidth: 'auto', height: '36px', width: '36px', borderRadius: '50%', color: 'var(--color-danger-red)' }}
                        />
                    </div>
                )}
            </div>
        </Card>
    );
};
