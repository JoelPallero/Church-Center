import type { FC } from 'react';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ChordSheetRenderer } from '../../../components/music/ChordSheetRenderer';
import type { ChordViewMode } from '../../../components/music/ChordSheetRenderer';
import { Metronome } from '../../../components/music/Metronome';
import { songService } from '../../../services/songService';
import type { Song } from '../../../services/songService';
import { musicUtils } from '../../../utils/musicUtils';

export const SongDetail: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const [song, setSong] = useState<Song | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    // Get query params
    const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const initialSingerId = queryParams.get('singer');

    // Musical State
    const [transpose, setTranspose] = useState(0);
    const [viewMode, setViewMode] = useState<ChordViewMode>('american');
    const [selectedSingerId, setSelectedSingerId] = useState<number | null>(null);
    const [fontSize, setFontSize] = useState(16);

    useEffect(() => {
        if (id) loadSong(id);
    }, [id]);

    const handleSingerChange = (singerId: number | null) => {
        setSelectedSingerId(singerId);
        if (singerId === null || !song) {
            setTranspose(0);
            return;
        }

        const assignment = song.memberKeys?.find(mk => mk.memberId === singerId);
        if (assignment) {
            const originalIdx = musicUtils.getSemitoneIndex(song.originalKey);
            const targetIdx = musicUtils.getSemitoneIndex(assignment.preferredKey);
            let diff = targetIdx - originalIdx;
            while (diff > 6) diff -= 12;
            while (diff <= -6) diff += 12;

            setTranspose(diff);
        }
    };

    const loadSong = async (songId: string) => {
        try {
            setLoading(true);
            const data = await songService.getById(songId);
            setSong(data);

            if (data && initialSingerId) {
                const singerIdNum = parseInt(initialSingerId);
                const assignment = data.memberKeys?.find(mk => mk.memberId === singerIdNum);
                if (assignment) {
                    setSelectedSingerId(singerIdNum);
                    const originalIdx = musicUtils.getSemitoneIndex(data.originalKey);
                    const targetIdx = musicUtils.getSemitoneIndex(assignment.preferredKey);
                    let diff = targetIdx - originalIdx;
                    while (diff > 6) diff -= 12;
                    while (diff <= -6) diff += 12;
                    setTranspose(diff);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4 text-center">{t('common.loading')}</div>;
    if (!song) return <div className="p-4 text-center">{t('songs.notFound')}</div>;

    // Calculate current key based on transposition
    const currentKey = musicUtils.transposeNote(song.originalKey, transpose);

    return (
        <div style={{ padding: '24px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', minWidth: 0 }}>
            {/* Minimal Header / Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 4px' }}>
                <Button
                    variant="ghost"
                    onClick={() => navigate('/worship/songs' + (song.churchId ? `?church_id=${song.churchId}` : ''))}
                    style={{ padding: '8px', marginRight: '4px' }}
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </Button>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <h1 className="text-h2" style={{ margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{song.title}</h1>
                    <p className="text-overline" style={{ margin: 0, color: 'gray' }}>{song.artist}</p>
                </div>
                <Button
                    variant="ghost"
                    onClick={() => navigate(`/worship/songs/${id}/edit`)}
                    style={{ padding: '8px' }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                </Button>
            </div>

            {/* Desktop 3-Column Layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr)',
                gap: '24px',
                alignItems: 'start'
            }} className="song-detail-grid">
                <style>{`
                    @media (min-width: 1200px) {
                    .song-detail-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }
                `}</style>

                {/* Column 1: Controls & Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Card style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="text-overline" style={{ fontSize: '10px', color: 'var(--color-ui-text-soft)' }}>TONALIDAD</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                    <span className="text-h1" style={{ fontSize: '32px', color: 'var(--color-brand-blue)', lineHeight: 1 }}>{currentKey}</span>
                                    {transpose !== 0 && <span className="text-overline" style={{ opacity: 0.5 }}>({song.originalKey})</span>}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '4px' }}>
                                <Button variant="secondary" onClick={() => setTranspose(p => p - 1)} style={{ flex: 1, height: '36px' }} label="-" />
                                <Button variant="secondary" onClick={() => setTranspose(0)} style={{ flex: 1.5, height: '36px', fontWeight: 'bold' }} label="Reset" />
                                <Button variant="secondary" onClick={() => setTranspose(p => p + 1)} style={{ flex: 1, height: '36px' }} label="+" />
                            </div>

                            <div className="dropdown-divider" style={{ margin: '4px 0' }} />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <span className="text-overline" style={{ fontSize: '9px' }}>TEMPO</span>
                                    <p style={{ fontWeight: 700, margin: 0 }}>{song.tempo} BPM</p>
                                </div>
                                <div>
                                    <span className="text-overline" style={{ fontSize: '9px' }}>COMPÁS</span>
                                    <p style={{ fontWeight: 700, margin: 0 }}>{song.timeSignature || '4/4'}</p>
                                </div>
                            </div>

                            {song.tempo && <Metronome bpm={song.tempo} variant="card" />}
                        </div>
                    </Card>

                    <Card style={{ padding: '20px' }}>
                        <h4 className="text-overline" style={{ marginBottom: '12px' }}>CONFIGURACIÓN</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label className="text-overline" style={{ fontSize: '9px', display: 'block', marginBottom: '4px' }}>NOTACIÓN</label>
                                <div style={{ display: 'flex', backgroundColor: 'var(--color-ui-surface)', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                                    {['american', 'spanish', 'roman', 'lyrics'].map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setViewMode(mode as any)}
                                            style={{
                                                flex: 1,
                                                padding: '6px 0',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                border: 'none',
                                                borderRadius: '7px',
                                                cursor: 'pointer',
                                                backgroundColor: viewMode === mode ? 'var(--color-brand-blue)' : 'transparent',
                                                color: viewMode === mode ? 'white' : 'var(--color-ui-text-soft)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {mode === 'american' ? 'AM' : mode === 'spanish' ? 'LA' : mode === 'roman' ? 'VM' : 'TXT'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {song.memberKeys && song.memberKeys.length > 0 && (
                                <div>
                                    <label className="text-overline" style={{ fontSize: '9px', display: 'block', marginBottom: '4px' }}>CANTANTE</label>
                                    <select
                                        className="text-body"
                                        value={selectedSingerId || ''}
                                        onChange={e => handleSingerChange(e.target.value ? parseInt(e.target.value) : null)}
                                        style={{
                                            width: '100%',
                                            background: 'var(--color-ui-surface)',
                                            border: '1px solid var(--color-border-subtle)',
                                            borderRadius: '8px',
                                            color: 'var(--color-ui-text)',
                                            padding: '8px',
                                            fontSize: '12px'
                                        }}
                                    >
                                        <option value="">Original</option>
                                        {song.memberKeys.map(mk => (
                                            <option key={mk.memberId} value={mk.memberId}>{mk.memberName}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="text-overline" style={{ fontSize: '9px', display: 'block', marginBottom: '4px' }}>TAMAÑO LETRA</label>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <Button variant="ghost" onClick={() => setFontSize(s => Math.max(10, s - 2))} style={{ flex: 1, height: '32px' }} label="-" />
                                    <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: '12px' }}>{fontSize}</span>
                                    <Button variant="ghost" onClick={() => setFontSize(s => Math.min(30, s + 2))} style={{ flex: 1, height: '32px' }} label="+" />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Column 2: The Sheet */}
                <Card style={{ padding: '32px', minHeight: '600px', borderRadius: '24px' }}>
                    <ChordSheetRenderer
                        content={song.content}
                        transpose={transpose}
                        viewMode={viewMode}
                        songKey={song.originalKey}
                        fontSize={fontSize}
                    />
                </Card>

                {/* Column 3: Multimedia & Resources */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {song.youtubeUrl && (
                        <Card style={{ padding: '12px', overflow: 'hidden' }}>
                            <h4 className="text-overline" style={{ marginBottom: '12px', marginLeft: '8px' }}>VIDEO REFERENCIA</h4>
                            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000' }}>
                                <iframe
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                    src={`https://www.youtube.com/embed/${song.youtubeUrl.split('v=')[1]?.split('&')[0] || song.youtubeUrl.split('/').pop()}`}
                                    title="YouTube video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </Card>
                    )}

                    <Card style={{ padding: '20px' }}>
                        <h4 className="text-overline" style={{ marginBottom: '16px' }}>VERSIONES</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '12px', backgroundColor: 'var(--color-ui-surface)' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)' }}>description</span>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>Acordes Originales</p>
                                    <p style={{ fontSize: '11px', color: 'var(--color-ui-text-soft)', margin: 0 }}>PDF • 120 KB</p>
                                </div>
                                <Button variant="ghost" icon="download" style={{ minWidth: 'auto', padding: '6px' }} />
                            </div>
                            {/* Hidden file upload logic here if needed, but UI wise we just show versions */}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};


