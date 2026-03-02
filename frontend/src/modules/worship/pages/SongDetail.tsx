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
    const [showAdvanced, setShowAdvanced] = useState(false);

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
        <div style={{ paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

            {/* Compact Controls Bar (Non-sticky) */}
            <Card style={{
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {/* Key and Notation Type (Always Visible) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="text-overline" style={{ fontSize: '9px' }}>{t('songs.originalKey') || 'Tono Original'}</span>
                            <span className="text-h2" style={{ color: 'var(--color-ui-text-soft)', lineHeight: 1 }}>{song.originalKey}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                            <Button
                                variant="secondary"
                                onClick={() => setTranspose(p => p - 1)}
                                style={{ width: '32px', height: '32px', padding: 0 }}
                                label="-"
                            />
                            <Button
                                variant={transpose === 0 ? "secondary" : "primary"}
                                onClick={() => setTranspose(0)}
                                style={{ padding: '0 12px', fontSize: '16px', height: '32px', fontWeight: 'bold', minWidth: '44px' }}
                                label={currentKey}
                            />
                            <Button
                                variant="secondary"
                                onClick={() => setTranspose(p => p + 1)}
                                style={{ width: '32px', height: '32px', padding: 0 }}
                                label="+"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                            variant={showAdvanced ? 'primary' : 'secondary'}
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            style={{ width: '40px', height: '40px', padding: 0 }}
                            icon={showAdvanced ? 'expand_less' : 'tune'}
                        />
                    </div>
                </div>

                {/* Advanced Collapsible Section */}
                {showAdvanced && (
                    <div style={{
                        borderTop: '1px solid var(--color-border-subtle)',
                        paddingTop: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        {/* Row: Notation Toggles and Singer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', backgroundColor: 'var(--color-ui-surface)', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                                {[
                                    { id: 'american', label: 'Am' },
                                    { id: 'spanish', label: 'La' },
                                    { id: 'roman', label: 'Vm' },
                                    { id: 'lyrics', label: 'Letra' }
                                ].map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => setViewMode(mode.id as any)}
                                        style={{
                                            padding: '6px 12px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            backgroundColor: viewMode === mode.id ? 'var(--color-brand-blue)' : 'transparent',
                                            color: viewMode === mode.id ? 'white' : 'var(--color-ui-text-soft)',
                                            transition: 'all 0.2s',
                                            minWidth: '40px'
                                        }}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>

                            {song.memberKeys && song.memberKeys.length > 0 && (
                                <select
                                    className="text-body"
                                    value={selectedSingerId || ''}
                                    onChange={e => handleSingerChange(e.target.value ? parseInt(e.target.value) : null)}
                                    style={{
                                        background: 'var(--color-ui-surface)',
                                        border: '1px solid var(--color-border-subtle)',
                                        borderRadius: '8px',
                                        color: 'var(--color-ui-text)',
                                        padding: '4px 8px',
                                        fontSize: '12px'
                                    }}
                                >
                                    <option value="">{t('songs.original')}</option>
                                    {song.memberKeys.map(mk => (
                                        <option key={mk.memberId} value={mk.memberId}>{mk.memberName}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Row: Metronome and Font Size */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {song.tempo && (
                                <Metronome bpm={song.tempo} variant="card" />
                            )}

                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'gray' }}>format_size</span>
                                <Button
                                    variant="ghost"
                                    onClick={() => setFontSize(s => Math.max(10, s - 2))}
                                    style={{ width: '28px', height: '28px', padding: 0 }}
                                    label="-"
                                />
                                <span style={{ fontSize: '12px', minWidth: '20px', textAlign: 'center' }}>{fontSize}</span>
                                <Button
                                    variant="ghost"
                                    onClick={() => setFontSize(s => Math.min(30, s + 2))}
                                    style={{ width: '28px', height: '28px', padding: 0 }}
                                    label="+"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Row 3: Song Content */}
            <div style={{
                backgroundColor: 'var(--color-card-bg)',
                borderRadius: '24px',
                padding: '16px',
                minHeight: '400px',
                border: '1px solid var(--color-border-subtle)'
            }}>
                {/* Metadata */}
                <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', color: 'gray', fontSize: '13px', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="text-overline">TEMPO</span>
                        <strong style={{ color: 'var(--color-ui-text)' }}>{song.tempo} BPM</strong>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="text-overline">COMPÁS</span>
                        <strong style={{ color: 'var(--color-ui-text)' }}>4/4</strong>
                    </div>
                </div>

                {/* The Actual Sheet */}
                <ChordSheetRenderer
                    content={song.content}
                    transpose={transpose}
                    viewMode={viewMode}
                    songKey={song.originalKey}
                    fontSize={fontSize}
                />
            </div>
        </div>
    );
};


