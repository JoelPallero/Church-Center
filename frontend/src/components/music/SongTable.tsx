import { type FC, type MouseEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { Song } from '../../services/songService';
import { Button } from '../ui/Button';
import { Metronome } from './Metronome';

interface SongTableProps {
    songs: (Song & { isAssigned?: boolean; singerName?: string })[];
    singerIdFilter?: number | null;
    selectedId?: string;
    onSelect?: (song: any) => void;
}

export const SongTable: FC<SongTableProps> = ({ songs, singerIdFilter, selectedId, onSelect }) => {
    const { hasPermission, isMaster } = useAuth();
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

    const handleRowClick = (song: any) => {
        if (onSelect) {
            onSelect(song);
        } else {
            navigate(buildUrl(`/worship/songs/${song.id}`));
        }
    };

    return (
        <div style={{
            backgroundColor: 'var(--color-card-bg)',
            borderRadius: '16px',
            border: '1px solid var(--color-border-subtle)',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ui-text-soft)' }}>Título</th>
                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ui-text-soft)' }}>Artista</th>
                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ui-text-soft)', textAlign: 'center' }}>Tono</th>
                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ui-text-soft)', textAlign: 'center' }}>BPM</th>
                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ui-text-soft)', textAlign: 'right' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {songs.map(song => (
                        <tr
                            key={`${song.id}-${song.isAssigned ? 'assigned' : 'orig'}`}
                            onClick={() => handleRowClick(song)}
                            style={{
                                borderBottom: '1px solid var(--color-border-subtle)',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s',
                                backgroundColor: selectedId === song.id ? 'rgba(59, 130, 246, 0.08)' : 'transparent'
                            }}
                            className="table-row-hover"
                        >
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)', fontSize: '20px' }}>play_circle</span>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--color-ui-text)' }}>{song.title}</div>
                                        {song.isAssigned && (
                                            <div style={{ fontSize: '11px', color: 'var(--color-brand-blue)', fontWeight: 600 }}>Asignado a: {song.singerName}</div>
                                        )}
                                        {isMaster && song.churchName && (
                                            <div style={{ fontSize: '10px', color: 'var(--color-ui-text-soft)' }}>{song.churchName}</div>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td style={{ padding: '16px 24px', color: 'var(--color-ui-text-soft)', fontSize: '14px' }}>{song.artist}</td>
                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(63, 108, 222, 0.1)',
                                    color: 'var(--color-brand-blue)',
                                    fontWeight: 700,
                                    fontSize: '12px'
                                }}>
                                    {song.originalKey}
                                </span>
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{song.tempo}</span>
                                    {song.tempo && <Metronome bpm={song.tempo} variant="card" />}
                                </div>
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                    {hasPermission('songs.edit') && (
                                        <Button
                                            variant="ghost"
                                            icon="edit"
                                            onClick={(e: MouseEvent) => {
                                                e.stopPropagation();
                                                navigate(buildUrl(`/worship/songs/${song.id}/edit`));
                                            }}
                                            style={{ padding: '8px', minWidth: 'auto' }}
                                        />
                                    )}
                                    <Button
                                        variant="ghost"
                                        icon="chevron_right"
                                        style={{ padding: '8px', minWidth: 'auto' }}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
