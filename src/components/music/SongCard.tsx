import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Metronome } from './Metronome';
import { useAuth } from '../../hooks/useAuth';
import type { Song } from '../../services/songService';
import { type FC, type MouseEvent } from 'react';

interface SongCardProps {
    song: Song & { isAssigned?: boolean; singerName?: string };
    singerIdFilter?: number | null;
}

export const SongCard: FC<SongCardProps> = ({ song, singerIdFilter }) => {
    const { hasPermission } = useAuth();
    const navigate = useNavigate();

    return (
        <Card
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                cursor: 'pointer',
                borderLeft: song.isAssigned ? '4px solid var(--color-brand-blue)' : 'none',
                transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onClick={() => navigate(`/songs/${song.id}${song.isAssigned ? `?singer=${singerIdFilter}` : ''}`)}
        >
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 className="text-card-title">{song.title}</h3>
                    {song.isAssigned && (
                        <span className="text-overline" style={{ color: 'var(--color-brand-blue)', fontWeight: 'bold' }}>
                            ({song.singerName})
                        </span>
                    )}
                </div>
                <p className="text-overline text-muted" style={{ marginTop: '4px' }}>{song.artist}</p>
                {song.memberKeys && song.memberKeys.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {song.memberKeys.map((mk, idx) => (
                            <div key={idx} style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                backgroundColor: 'rgba(255,255,255,0.04)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                color: '#94A3B8',
                                border: '1px solid rgba(255,255,255,0.02)'
                            }}>
                                <span style={{ color: 'var(--color-brand-blue)' }}>{mk.memberName}:</span> {mk.preferredKey}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <span className="text-overline" style={{
                        backgroundColor: song.isAssigned ? 'var(--color-brand-blue)' : 'var(--color-ui-surface)',
                        color: song.isAssigned ? 'white' : 'inherit',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                    }}>
                        {song.originalKey}
                    </span>
                    <span className="text-overline text-muted" style={{ fontSize: '10px' }}>
                        {song.tempo} BPM
                    </span>
                </div>

                {song.tempo && (
                    <div style={{ paddingLeft: '8px', borderLeft: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center' }}>
                        <Metronome bpm={song.tempo} variant="card" />
                    </div>
                )}

                {hasPermission('songs.edit') && (
                    <Button
                        variant="ghost"
                        icon="edit"
                        onClick={(e: MouseEvent) => {
                            e.stopPropagation();
                            navigate(`/songs/${song.id}/edit`);
                        }}
                        style={{ padding: '8px', minWidth: 'auto', height: 'auto', borderRadius: '50%' }}
                    />
                )}
            </div>
        </Card>
    );
};
