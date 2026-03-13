import { type FC, type MouseEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { Song } from '../../services/songService';
import { Button } from '../ui/Button';
import { Metronome } from './Metronome';
import { musicUtils } from '../../utils/musicUtils';

interface SongTableProps {
    songs: (Song & { isAssigned?: boolean; singerName?: string })[];
    singerIdFilter?: number | null;
    selectedId?: string;
    onSelect?: (song: any) => void;
    onDelete?: (id: number | string) => void;
}

export const SongTable: FC<SongTableProps> = ({ songs, singerIdFilter, selectedId, onSelect, onDelete }) => {
    const { isMaster, canManageSongs } = useAuth();
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
            overflow: 'visible',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ui-text-soft)' }}>Título</th>
                        <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ui-text-soft)' }}>Artista</th>
                        <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ui-text-soft)', textAlign: 'center' }}>Tono</th>
                        <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ui-text-soft)', textAlign: 'center' }}>BPM</th>
                        <th style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ui-text-soft)', textAlign: 'right' }}>Acciones</th>
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
                            <td style={{ padding: '8px 12px', width: '35%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)', fontSize: '18px', opacity: 0.8 }}>music_note</span>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--color-ui-text)', fontSize: '14px', lineHeight: 1.2 }}>{song.title}</div>
                                        {song.isAssigned && (
                                            <div style={{ fontSize: '11px', color: 'var(--color-brand-blue)', fontWeight: 600 }}>{song.singerName}</div>
                                        )}
                                        {(Number(song.churchId) === 0 || (isMaster && song.churchName)) && (
                                            <div style={{ 
                                                fontSize: '10px', 
                                                backgroundColor: Number(song.churchId) === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                                color: Number(song.churchId) === 0 ? '#10B981' : 'var(--color-brand-blue)',
                                                padding: '0px 6px',
                                                borderRadius: '10px',
                                                fontWeight: 700,
                                                display: 'inline-block',
                                                marginTop: '2px',
                                                textTransform: 'uppercase'
                                            }}>
                                                {Number(song.churchId) === 0 ? 'GLOBAL' : song.churchName}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--color-ui-text-soft)', fontSize: '13px', width: '25%' }}>{song.artist}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', width: '15%' }}>
                                {song.originalKey && (
                                    <span style={{
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: 'rgba(63, 108, 222, 0.12)',
                                        color: 'var(--color-brand-blue)',
                                        fontWeight: 800,
                                        fontSize: '12px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {musicUtils.formatKey(song.originalKey, 'spanish')}
                                    </span>
                                )}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center', width: '10%' }}>
                                <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-ui-text)' }}>
                                    {song.tempo} <small style={{ fontWeight: 400, opacity: 0.6, fontSize: '11px' }}>BPM</small>
                                </span>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', width: '15%' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                                    {song.tempo && Number(song.tempo) > 0 && (
                                        <div style={{ marginRight: '4px' }}>
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
                                                style={{ padding: '6px', minWidth: 'auto', color: 'var(--color-brand-blue)' }}
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
                                                style={{ padding: '6px', minWidth: 'auto', color: 'var(--color-danger-red)' }}
                                            />
                                        </div>
                                    )}
                                    <Button
                                        variant="ghost"
                                        icon="chevron_right"
                                        style={{ padding: '6px', minWidth: 'auto', opacity: 0.5 }}
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
