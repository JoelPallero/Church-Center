import type { FC } from 'react';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useAuth } from '../../../hooks/useAuth';
import { ChordSheetRenderer } from '../../../components/music/ChordSheetRenderer';
import type { ChordViewMode } from '../../../components/music/ChordSheetRenderer';
import { Metronome } from '../../../components/music/Metronome';
import { songService } from '../../../services/songService';
import type { Song } from '../../../services/songService';
import { musicUtils } from '../../../utils/musicUtils';

import { useTutorials } from '../../../context/TutorialContext';

export const SongDetail: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { user, canManageSongs, hasRole, hasService } = useAuth();
    const { startTutorial, showTutorials } = useTutorials();

    const [song, setSong] = useState<Song | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!showTutorials || !user || loading) return;

        const hasSeenFullTour = localStorage.getItem('tutorial_seen_worship_master');
        if (hasSeenFullTour === 'true') return;

        if (hasRole('master')) return;

        const isLeader = hasRole('leader');
        const isCoordinator = hasRole('coordinator');
        const isPastor = hasRole('pastor');
        const isPraiseMember = hasService('worship');

        if (isLeader || isCoordinator || isPastor || isPraiseMember) {
            // Stage 2: Detail
            localStorage.setItem('worship_tour_stage', 'detail');
            startTutorial('worship_detail');
        }
    }, [user, showTutorials, loading, hasRole, hasService, startTutorial]);

    // Get query params
    const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const initialSingerId = queryParams.get('singer');

    // Musical State
    const [transpose, setTranspose] = useState(0);
    const [viewMode, setViewMode] = useState<ChordViewMode>('american');
    const [selectedSingerId, setSelectedSingerId] = useState<number | null>(null);
    const [fontSize, setFontSize] = useState(16);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        <div style={{ paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', minWidth: 0 }}>
            {/* Minimal Header / Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 4px' }}>
                <Button
                    id="btn-back-worship"
                    variant="ghost"
                    onClick={() => navigate('/worship/songs' + (song.churchId ? `?church_id=${song.churchId}` : ''))}
                    style={{ padding: '8px', marginRight: '4px' }}
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </Button>
                <div id="song-full-view-header" style={{ flex: 1, overflow: 'hidden' }}>
                    <h1 className="text-h2" style={{ margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{song.title}</h1>
                    <p className="text-overline" style={{ margin: 0, color: 'gray' }}>{song.artist}</p>
                </div>
                {canManageSongs && (
                    <Button
                        variant="ghost"
                        onClick={() => navigate(`/worship/songs/${id}/edit`)}
                        style={{ padding: '8px' }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                    </Button>
                )}
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
                            grid-template-rows: auto 1fr;
                        }
                        .controls-container {
                            grid-column: span 2;
                            flex-direction: row !important;
                        }
                        .sheet-container {
                            grid-column: span 2;
                        }
                        .resources-container {
                            grid-column: 3;
                            grid-row: 1 / 3;
                        }
                        .control-card {
                            flex: 1;
                        }
                    }
                `}</style>

                {/* Column 1: Controls & Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="controls-container">
                    <Card style={{ padding: '12px 16px' }} className="control-card">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Row 1: Tonalidad & Asignación */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="text-overline" style={{ fontSize: '9px', color: 'var(--color-ui-text-soft)', lineHeight: 1, marginBottom: '4px' }}>TONALIDAD</span>
                                    <div id="song-transpose-controls" style={{ display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: 'var(--color-ui-surface)', borderRadius: '20px', padding: '2px 6px', border: '1px solid var(--color-border-subtle)' }}>
                                        <Button variant="ghost" onClick={() => setTranspose(p => p - 1)} style={{ width: '28px', height: '28px', minWidth: 'auto', padding: 0 }} icon="remove" />
                                        <span
                                            onClick={() => {
                                                setTranspose(0);
                                                setSelectedSingerId(null);
                                            }}
                                            style={{
                                                fontSize: '12px',
                                                color: 'var(--color-brand-blue)',
                                                lineHeight: 1,
                                                fontWeight: 800,
                                                padding: '4px 8px',
                                                cursor: 'pointer',
                                                minWidth: '65px',
                                                textAlign: 'center'
                                            }}>
                                            {musicUtils.formatKey(currentKey, viewMode === 'american' ? 'american' : 'spanish')}
                                        </span>
                                        <Button variant="ghost" onClick={() => setTranspose(p => p + 1)} style={{ width: '28px', height: '28px', minWidth: 'auto', padding: 0 }} icon="add" />
                                    </div>
                                    {transpose !== 0 && !selectedSingerId && (
                                        <span className="text-overline" style={{ opacity: 0.5, fontSize: '8px', marginTop: '2px' }}>
                                            (Orig: {musicUtils.formatKey(song.originalKey, viewMode === 'american' ? 'american' : 'spanish')})
                                        </span>
                                    )}
                                </div>

                                {song.memberKeys && song.memberKeys.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flex: 1, minWidth: 0 }}>
                                        <span className="text-overline" style={{ fontSize: '9px', color: 'var(--color-ui-text-soft)', lineHeight: 1, marginBottom: '6px' }}>ASIGNACIÓN</span>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            {song.memberKeys.map(mk => (
                                                <div
                                                    key={mk.memberId}
                                                    onClick={() => handleSingerChange(selectedSingerId === mk.memberId ? null : mk.memberId)}
                                                    style={{
                                                        fontSize: '10px',
                                                        fontWeight: 700,
                                                        color: selectedSingerId === mk.memberId ? 'var(--color-brand-blue)' : 'var(--color-ui-text-soft)',
                                                        cursor: 'pointer',
                                                        backgroundColor: selectedSingerId === mk.memberId ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-ui-surface)',
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        border: `1px solid ${selectedSingerId === mk.memberId ? 'var(--color-brand-blue)' : 'var(--color-border-subtle)'}`,
                                                        transition: 'all 0.2s',
                                                        whiteSpace: 'nowrap',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: selectedSingerId === mk.memberId ? "'FILL' 1" : "'FILL' 0" }}>person</span>
                                                    {mk.memberName}
                                                    <span style={{ opacity: 0.6, fontSize: '9px' }}>({musicUtils.formatKey(mk.preferredKey)})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Row 2: Tempo and Compás */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '12px' }}>
                                <div id="song-metronome-full" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span className="text-overline" style={{ fontSize: '9px', lineHeight: 1, color: 'var(--color-ui-text-soft)', marginBottom: '4px' }}>TEMPO</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <p style={{ fontWeight: 800, margin: 0, fontSize: '13px', color: 'var(--color-ui-text)' }}>{song.tempo} <span style={{ fontSize: '9px', opacity: 0.7 }}>BPM</span></p>
                                            {(song.tempo && Number(song.tempo) > 0) && (
                                                <Metronome bpm={Number(song.tempo)} variant="card" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <span className="text-overline" style={{ fontSize: '9px', lineHeight: 1, color: 'var(--color-ui-text-soft)', marginBottom: '4px' }}>COMPÁS</span>
                                    <p style={{ fontWeight: 800, margin: 0, fontSize: '13px', color: 'var(--color-ui-text)' }}>{song.timeSignature || '4/4'}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card style={{ padding: isMobile ? '12px 16px' : '20px' }} className="control-card">
                        <h4 className="text-overline" style={{ marginBottom: '12px', marginTop: 0 }}>CONFIGURACIÓN</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="text-overline" style={{ fontSize: '9px', display: 'block', marginBottom: '4px' }}>NOTACIÓN</label>
                                    <div id="song-notation-controls" style={{ display: 'flex', backgroundColor: 'var(--color-ui-surface)', borderRadius: '10px', padding: '3px', gap: '2px' }}>
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

                                {!isMobile && (
                                    <div style={{ flex: 1 }}>
                                        <label className="text-overline" style={{ fontSize: '9px', display: 'block', marginBottom: '4px' }}>TAMAÑO LETRA</label>
                                        <div id="song-fontsize-controls" style={{ display: 'flex', gap: '2px', alignItems: 'center', backgroundColor: 'var(--color-ui-surface)', borderRadius: '10px', padding: '3px' }}>
                                            <Button variant="ghost" onClick={() => setFontSize(s => Math.max(10, s - 2))} style={{ width: '28px', height: '28px', minWidth: 'auto', padding: 0 }} icon="remove" />
                                            <span style={{ flex: 1, textAlign: 'center', fontWeight: 800, fontSize: '11px', color: 'var(--color-ui-text)' }}>{fontSize}</span>
                                            <Button variant="ghost" onClick={() => setFontSize(s => Math.min(30, s + 2))} style={{ width: '28px', height: '28px', minWidth: 'auto', padding: 0 }} icon="add" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Column 2: The Sheet */}
                <Card className="sheet-container" style={{ padding: isMobile ? '16px' : '32px', minHeight: '600px', borderRadius: '24px', position: 'relative' }}>
                    {isMobile && (
                        <div 
                            id="song-fontsize-controls"
                            style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                zIndex: 10,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: 'var(--color-ui-surface)',
                                padding: '4px',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                border: '1px solid var(--color-border-subtle)'
                            }}
                        >
                            <Button variant="ghost" onClick={() => setFontSize(s => Math.max(10, s - 2))} style={{ width: '30px', height: '30px', minWidth: 'auto', padding: 0 }} icon="remove" />
                            <span style={{ fontSize: '11px', fontWeight: 800, width: '20px', textAlign: 'center' }}>{fontSize}</span>
                            <Button variant="ghost" onClick={() => setFontSize(s => Math.min(30, s + 2))} style={{ width: '30px', height: '30px', minWidth: 'auto', padding: 0 }} icon="add" />
                        </div>
                    )}
                    <ChordSheetRenderer
                        content={song.content}
                        transpose={transpose}
                        viewMode={viewMode}
                        songKey={song.originalKey}
                        fontSize={fontSize}
                    />
                </Card>

                {/* Column 3: Multimedia & Resources */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="resources-container">
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


                </div>
            </div>
        </div>
    );
};


