import { useState, type FC, type MouseEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Metronome } from './Metronome';
import { useAuth } from '../../hooks/useAuth';
import type { Song } from '../../services/songService';
import { musicUtils } from '../../utils/musicUtils';
import { useConfirm } from '../../context/ConfirmContext';

interface SongCardProps {
    song: Song & { isAssigned?: boolean; singerName?: string };
    singerIdFilter?: number | null;
    onDelete?: (id: number | string) => void;
}

export const SongCard: FC<SongCardProps> = ({ song, singerIdFilter, onDelete }) => {
    const { canManageSongs, isMaster } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const confirm = useConfirm();
    const [menuOpen, setMenuOpen] = useState(false);
    const churchId = searchParams.get('church_id');

    const buildUrl = (path: string) => {
        const params = new URLSearchParams();
        if (churchId) params.set('church_id', churchId);
        if (singerIdFilter) params.set('singer', singerIdFilter.toString());
        const queryString = params.toString();
        return path + (queryString ? `?${queryString}` : '');
    };

    const handleMenuToggle = (e: MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(!menuOpen);
    };

    return (
        <Card
            style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '16px',
                cursor: 'pointer',
                borderLeft: song.isAssigned ? '4px solid var(--color-brand-blue)' : 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                gap: '12px',
                position: 'relative',
                overflow: 'visible'
            }}
            onClick={() => navigate(buildUrl(`/worship/songs/${song.id}`))}
        >
            {/* ROW 1: TITLE */}
            <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 className="text-card-title" style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{song.title}</h3>
                    {song.isAssigned && (
                        <span className="text-overline" style={{ color: 'var(--color-brand-blue)', fontWeight: 800, fontSize: '12px' }}>
                            ({song.singerName})
                        </span>
                    )}
                </div>
            </div>

            {/* ROW 2: INFO & ACTIONS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                
                {/* COLUMN 1: MAIN CONTENT (Info + Metronome) */}
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between', minWidth: 0, gap: '16px' }}>
                    
                    {/* INFO SUB-COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
                        {/* Row 1: Artist & Key */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <p className="text-overline" style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-ui-text-soft)' }}>{song.artist}</p>
                            {song.originalKey && (
                                <span style={{
                                    backgroundColor: 'rgba(63, 108, 222, 0.12)',
                                    color: 'var(--color-brand-blue)',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontWeight: 800,
                                    fontSize: '12px',
                                    lineHeight: 1
                                }}>
                                    {musicUtils.formatKey(song.originalKey, 'spanish')}
                                </span>
                            )}
                        </div>
                        
                        {/* Row 2: BPM & Global Tag */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span className="text-overline" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-ui-text-soft)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>speed</span>
                                {song.tempo} BPM
                            </span>
                            
                            {(Number(song.churchId) === 0 || (isMaster && song.churchName)) && (
                                <div style={{
                                    fontSize: '11px',
                                    backgroundColor: Number(song.churchId) === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                    color: Number(song.churchId) === 0 ? '#10B981' : 'var(--color-brand-blue)',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.03em'
                                }}>
                                    {Number(song.churchId) === 0 ? 'GLOBAL' : song.churchName}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* METRONOME SUB-COLUMN */}
                    {song.tempo && Number(song.tempo) > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Metronome bpm={Number(song.tempo)} variant="card" />
                        </div>
                    )}
                </div>

                {/* COLUMN 2: ACTION MENU (FAR RIGHT) */}
                {canManageSongs && (
                    <div style={{ position: 'relative', borderLeft: '1px solid var(--color-border-subtle)', paddingLeft: '8px', marginLeft: '8px' }}>
                        <Button
                            variant="ghost"
                            onClick={handleMenuToggle}
                            style={{ 
                                minWidth: 'auto', 
                                height: '58px', 
                                width: '48px', 
                                borderRadius: '12px', 
                                color: 'var(--color-ui-text-soft)',
                                backgroundColor: menuOpen ? 'rgba(0,0,0,0.05)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>more_vert</span>
                        </Button>
                        
                        {menuOpen && (
                            <div 
                                className="dropdown-menu" 
                                style={{ 
                                    position: 'absolute', 
                                    right: 0, 
                                    bottom: '65px', 
                                    width: '160px',
                                    zIndex: 100,
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: 'var(--color-card-bg)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border-subtle)',
                                    padding: '4px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div 
                                    className="dropdown-item" 
                                    style={{ 
                                        padding: '10px 12px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '10px', 
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        borderRadius: '8px'
                                    }}
                                    onClick={() => {
                                        navigate(buildUrl(`/worship/songs/${song.id}/edit`));
                                        setMenuOpen(false);
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                                    Editar
                                </div>
                                <div style={{ height: '1px', backgroundColor: 'var(--color-border-subtle)', margin: '4px 0' }} />
                                <div 
                                    className="dropdown-item" 
                                    style={{ 
                                        padding: '10px 12px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '10px', 
                                        cursor: 'pointer',
                                        color: 'var(--color-danger-red)',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        borderRadius: '8px'
                                    }}
                                    onClick={async () => {
                                        const confirmed = await confirm({
                                            title: 'Eliminar Canción',
                                            message: '¿Estás seguro de que deseas eliminar esta canción?',
                                            variant: 'danger',
                                            confirmText: 'Eliminar'
                                        });
                                        if (confirmed) {
                                            onDelete?.(song.id);
                                        }
                                        setMenuOpen(false);
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                                    Eliminar
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Indicators for reference links (subtle) */}
            {(song.youtubeUrl || song.spotifyUrl) && (
                <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '4px' }}>
                    {song.youtubeUrl && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FF0000' }} />}
                    {song.spotifyUrl && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1DB954' }} />}
                </div>
            )}
        </Card>
    );
};
