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
            // Ensure we take the shortest path or consistent direction? 
            // Standardizing to a range like -6 to +6 is usually better for musicians
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

            // If we have an initial singer ID from URL, apply it
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
        <div style={{ paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header / Navigation */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Button
                    variant="ghost"
                    onClick={() => navigate('/songs')}
                    style={{ padding: '8px', marginRight: '8px' }}
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </Button>
                <div>
                    <h1 className="text-h1" style={{ margin: 0 }}>{song.title}</h1>
                    <p className="text-body" style={{ color: 'gray', margin: 0 }}>{song.artist}</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => navigate(`/songs/${id}/edit`)}
                    style={{ marginLeft: 'auto', padding: '8px 20px', borderRadius: '12px' }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '8px' }}>edit</span>
                    {t('common.edit') || 'Editar'}
                </Button>
            </div>

            {/* Controls Bar */}
            <Card style={{ position: 'sticky', top: '70px', zIndex: 40, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Row 1: Key Transposer & Singer Selector */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="text-overline" style={{ color: 'gray' }}>{t('songs.key')}</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                <span className="text-h1" style={{ color: 'var(--color-brand-blue)' }}>{currentKey}</span>
                                {transpose !== 0 && (
                                    <span className="text-overline" style={{ color: 'gray' }}>
                                        ({song.originalKey} {transpose > 0 ? '+' : ''}{transpose})
                                    </span>
                                )}
                            </div>
                        </div>

                        {song.memberKeys && song.memberKeys.length > 0 && (
                            <div style={{ borderLeft: '1px solid var(--color-border-subtle)', paddingLeft: '16px', display: 'flex', flexDirection: 'column' }}>
                                <span className="text-overline" style={{ color: 'gray' }}>{t('songs.singer')}</span>
                                <select
                                    className="text-body"
                                    value={selectedSingerId || ''}
                                    onChange={e => handleSingerChange(e.target.value ? parseInt(e.target.value) : null)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--color-ui-text)',
                                        outline: 'none',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        padding: '4px 0'
                                    }}
                                >
                                    <option value="">{t('songs.original')}</option>
                                    {song.memberKeys.map(mk => (
                                        <option key={mk.memberId} value={mk.memberId}>{mk.memberName}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {!selectedSingerId && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button
                                variant="secondary"
                                onClick={() => setTranspose(p => p - 1)}
                                style={{ width: '40px', height: '40px', padding: 0 }}
                            >
                                -
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setTranspose(0)}
                                style={{ padding: '0 12px' }}
                            >
                                {t('common.reset')}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setTranspose(p => p + 1)}
                                style={{ width: '40px', height: '40px', padding: 0 }}
                            >
                                +
                            </Button>
                        </div>
                    )}
                </div>

                {/* Row 2: Metronome and View Toggles */}
                <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {song.tempo && (
                        <Metronome bpm={song.tempo} variant="inline" />
                    )}

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto', paddingBottom: '4px' }}>
                        <Button
                            variant={viewMode === 'american' ? 'primary' : 'ghost'}
                            onClick={() => setViewMode('american')}
                            style={{ fontSize: '12px', padding: '8px 12px', minWidth: 'auto' }}
                            label="Am"
                        >
                            Am
                        </Button>
                        <Button
                            variant={viewMode === 'spanish' ? 'primary' : 'ghost'}
                            onClick={() => setViewMode('spanish')}
                            style={{ fontSize: '12px', padding: '8px 12px', minWidth: 'auto' }}
                            label="Lam"
                        >
                            Lam
                        </Button>
                        <Button
                            variant={viewMode === 'roman' ? 'primary' : 'ghost'}
                            onClick={() => setViewMode('roman')}
                            style={{ fontSize: '12px', padding: '8px 12px', minWidth: 'auto' }}
                            label="Vm"
                        >
                            Vm
                        </Button>
                        <Button
                            variant={viewMode === 'lyrics' ? 'primary' : 'ghost'}
                            onClick={() => setViewMode('lyrics')}
                            style={{ fontSize: '12px', padding: '8px 12px', minWidth: 'auto' }}
                            label="Letra"
                        >
                            Letra
                        </Button>

                        <div style={{ borderLeft: '1px solid var(--color-border-subtle)', marginLeft: '8px', paddingLeft: '8px', display: 'flex', gap: '4px' }}>
                            <Button
                                variant="ghost"
                                onClick={() => setFontSize(s => Math.max(12, s - 2))}
                                style={{ padding: '4px', minWidth: '32px' }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>text_fields</span>
                                <span style={{ fontSize: '10px' }}>-</span>
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setFontSize(s => Math.min(32, s + 2))}
                                style={{ padding: '4px', minWidth: '32px' }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>text_fields</span>
                                <span style={{ fontSize: '10px' }}>+</span>
                            </Button>
                        </div>
                    </div>
                </div>
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


