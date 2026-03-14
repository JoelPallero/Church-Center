import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { songService } from '../../../services/songService';
import { useAuth } from '../../../hooks/useAuth';
import type { Song } from '../../../services/songService';
import { SongCard } from '../../../components/music/SongCard';
import { SongTable } from '../../../components/music/SongTable';
import { ChordSheetRenderer } from '../../../components/music/ChordSheetRenderer';
import type { ChordViewMode } from '../../../components/music/ChordSheetRenderer';
import { musicUtils } from '../../../utils/musicUtils';
import { peopleService } from '../../../services/peopleService';
import { Metronome } from '../../../components/music/Metronome';
import type { User } from '../../../types/domain';
import { useTutorials } from '../../../context/TutorialContext';
import { useConfirm } from '../../../context/ConfirmContext';

export const SongList: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isMaster, user, canManageSongs, hasRole, hasService, isSuperAdmin } = useAuth();
    const { showTutorials, startTutorial, setShowTutorials } = useTutorials();
    const confirm = useConfirm();
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [singers, setSingers] = useState<User[]>([]);

    useEffect(() => {
        if (!showTutorials || !user || loading) return;

        const hasSeenFullTour = localStorage.getItem('tutorial_seen_worship_master');
        if (hasSeenFullTour === 'true') return;

        // Excluir Super Admin
        if (isSuperAdmin || hasRole('master') || hasRole('superadmin')) return;

        const isLeader = hasRole('leader');
        const isCoordinator = hasRole('coordinator');
        const isPastor = hasRole('pastor');
        const isPraiseMember = hasService('worship');

        if (isLeader || isCoordinator || isPastor || isPraiseMember) {
            const stage = localStorage.getItem('worship_tour_stage') || 'list';
            if (stage === 'list') {
                // Prevent duplicate prompts
                localStorage.setItem('tutorial_seen_worship_master', 'pending');
                
                const askWorshipTour = async () => {
                    const wantsTutorial = await confirm({
                        title: t('tutorials.worship.welcome.title') || 'Recorrido de Culto',
                        message: t('tutorials.worship.welcome.desc') || '¿Quieres realizar un breve recorrido por la gestión de canciones y culto?',
                        confirmText: t('common.yes') || 'Sí, claro',
                        cancelText: t('common.no') || 'No, gracias'
                    });
                    
                    if (wantsTutorial) {
                        startTutorial('worship_list');
                        // driver.js will advance the stage when they click elements or we can just leave it as 'list'
                    } else {
                        setShowTutorials(false);
                        localStorage.setItem('user_show_tutorials', 'false');
                    }
                    localStorage.setItem('tutorial_seen_worship_master', 'true');
                };
                askWorshipTour();
            }
        }
    }, [user, showTutorials, loading, hasRole, hasService, startTutorial, confirm, setShowTutorials, isSuperAdmin, t]);

    // Pagination
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    // Advanced Filters
    const [filterKey, setFilterKey] = useState('');
    const [filterType, setFilterType] = useState<'' | 'fast' | 'slow'>('');
    const [filterSinger, setFilterSinger] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const churchId = searchParams.get('church_id') ? parseInt(searchParams.get('church_id')!) : null;
    const isPastor = user?.role?.name === 'pastor';
    const profileChurchId = user?.churchId;
    const finalChurchId = churchId || profileChurchId;

    useEffect(() => {
        // Redirect if no church context at all and user is Pastor (multitenant context)
        // Master users and Superadmins bypass selection and see global songs
        if (!finalChurchId && !isMaster && isPastor) {
            navigate('/mainhub/select-church/songs');
            return;
        }

        loadSongs();
        loadSingers();
    }, [finalChurchId, isMaster, isPastor]);

    const loadSingers = async () => {
        const data = await peopleService.getAll(finalChurchId || undefined);
        setSingers(data);
    };

    const loadSongs = async () => {
        try {
            setLoading(true);
            // Master users always see the global library regardless of church context
            const data = await songService.getAll(isMaster ? undefined : (finalChurchId || undefined));
            setSongs(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Obsolete secondary tutorial. Merged into the worship_master tour.
        // Keeping this empty or removed to avoid conflicts.
    }, []);

    // Generate the list to display based on filters
    const getDisplaySongs = () => {
        let list: any[] = [...songs];

        // 1. If singer filter is active, we expand the list with assignments
        if (filterSinger) {
            list = [];
            songs.forEach(song => {
                const assignment = song.memberKeys?.find(mk => mk.memberId === filterSinger);
                if (assignment) {
                    list.push({
                        ...song,
                        originalKey: assignment.preferredKey,
                        isAssigned: true,
                        singerName: assignment.memberName
                    });
                }
            });
        }

        // 2. Search
        if (searchTerm) {
            list = list.filter(s =>
                s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.artist.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 3. Category/Type Filter
        if (filterType) {
            list = list.filter(s => (s.bpmType || 'fast') === filterType);
        }

        // 4. Key Filter
        if (filterKey) {
            list = list.filter(s => s.originalKey === filterKey);
        }

        // 5. Alpha Sort removed to respect backend order (DESC)

        return list;
    };

    const allFilteredSongs = getDisplaySongs();
    const visibleSongs = allFilteredSongs.slice(0, page * PAGE_SIZE);
    const hasMore = allFilteredSongs.length > (page * PAGE_SIZE);

    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [transpose, setTranspose] = useState(0);
    const [viewMode, setViewMode] = useState<ChordViewMode>('american');
    const [fontSize, setFontSize] = useState(14);

    const handleSelectSong = (song: Song) => {
        setSelectedSong(song);
        setTranspose(0);
    };

    const handleDelete = async (id: number | string) => {
        const confirmed = await confirm({
            title: t('common.confirmDeleteTitle') || 'Eliminar Canción',
            message: t('common.confirmDelete') || '¿Estás seguro de que deseas eliminar esta canción?',
            variant: 'danger',
            confirmText: t('common.delete') || 'Eliminar'
        });
        if (!confirmed) return;
        
        const success = await songService.delete(id, finalChurchId || undefined);
        if (success) {
            loadSongs();
        }
    };

    return (
        <div style={{ position: 'relative', display: 'flex', gap: '24px', alignItems: 'start', width: '100%', minWidth: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <header id="songs-header" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        gap: '12px'
                    }}>
                        <h1 className="text-h1" style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 32px)', lineHeight: 1.2 }}>{t('songs.title')}</h1>
                        {canManageSongs && (
                            <div id="btn-new-song">
                                <Button
                                    variant="primary"
                                    icon="add"
                                    label={t('songs.add')}
                                    onClick={() => navigate('/worship/songs/new' + (finalChurchId ? `?church_id=${finalChurchId}` : ''))}
                                    style={{ height: '38px', padding: '0 16px', flexShrink: 0 }}
                                />
                            </div>
                        )}
                    </div>
                    <p className="text-body" style={{ color: 'var(--color-ui-text-soft)', marginBottom: '8px' }}>
                        {t('songs.description') || 'Gestiona el repertorio musical, tonalidades y recursos.'}
                    </p>

                    <div id="songs-search" style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <span className="material-symbols-outlined text-muted" style={{
                                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)'
                            }}>search</span>
                            <input
                                type="text"
                                placeholder={t('songs.search')}
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border-subtle)',
                                    backgroundColor: 'var(--color-ui-bg)',
                                    color: 'var(--color-ui-text)',
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <Button
                            variant="secondary"
                            onClick={() => setShowFilters(!showFilters)}
                            icon="filter_list"
                        />
                    </div>

                    {showFilters && (
                        <Card style={{ padding: '16px', marginTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                            <div>
                                <label className="text-overline text-muted" style={{ display: 'block', marginBottom: '4px' }}>{t('songs.key')}</label>
                                <select
                                    value={filterKey}
                                    onChange={e => { setFilterKey(e.target.value); setPage(1); }}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: 'var(--color-ui-bg)', color: 'var(--color-ui-text)', border: '1px solid var(--color-border-subtle)', outline: 'none', fontSize: '13px' }}
                                >
                                    <option value="">{t('common.all')}</option>
                                    {['C', 'Cm', 'C#', 'C#m', 'Db', 'Dbm', 'D', 'Dm', 'Eb', 'Ebm', 'E', 'Em', 'F', 'Fm', 'F#', 'F#m', 'Gb', 'Gbm', 'G', 'Gm', 'Ab', 'Abm', 'A', 'Am', 'Bb', 'Bbm', 'B', 'Bm'].map(k => (
                                        <option key={k} value={k}>{musicUtils.formatKey(k)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-overline text-muted" style={{ display: 'block', marginBottom: '4px' }}>{t('songs.typeLabel')}</label>
                                <select
                                    value={filterType}
                                    onChange={e => { setFilterType(e.target.value as any); setPage(1); }}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: 'var(--color-ui-bg)', color: 'var(--color-ui-text)', border: '1px solid var(--color-border-subtle)', outline: 'none', fontSize: '13px' }}
                                >
                                    <option value="">{t('common.all')}</option>
                                    <option value="fast">{t('songs.fast')}</option>
                                    <option value="slow">{t('songs.slow')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-overline text-muted" style={{ display: 'block', marginBottom: '4px' }}>{t('songs.singerAssignments')}</label>
                                <select
                                    value={filterSinger || ''}
                                    onChange={e => { setFilterSinger(e.target.value ? parseInt(e.target.value) : null); setPage(1); }}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: 'var(--color-ui-bg)', color: 'var(--color-ui-text)', border: '1px solid var(--color-border-subtle)', outline: 'none', fontSize: '13px' }}
                                >
                                    <option value="">{t('common.general')}</option>
                                    {singers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </Card>
                    )}
                </header>

                <div className="mobile-only" style={{ display: 'grid', gap: '8px' }}>
                    {loading ? (
                        <p className="text-body" style={{ textAlign: 'center', color: 'gray' }}>{t('common.loading')}</p>
                    ) : visibleSongs.length === 0 ? (
                        <p className="text-body" style={{ textAlign: 'center', color: 'gray', marginTop: '40px' }}>{t('songs.noSongs')}</p>
                    ) : (
                        <>
                            {visibleSongs.map(song => (
                                <SongCard
                                    key={`${song.id}-${song.isAssigned ? 'assigned' : 'orig'}`}
                                    song={song}
                                    singerIdFilter={filterSinger}
                                    onDelete={handleDelete}
                                />
                            ))}

                            {hasMore && (
                                <Button
                                    variant="secondary"
                                    onClick={() => setPage(p => p + 1)}
                                    style={{ marginTop: '12px', width: '100%' }}
                                >
                                    {t('songs.loadMore')}
                                </Button>
                            )}
                        </>
                    )}
                </div>

                <div className="desktop-only">
                    {loading ? (
                        <div className="flex-center" style={{ height: '200px' }}><div className="spinner" /></div>
                    ) : visibleSongs.length === 0 ? (
                        <Card style={{ padding: '60px', textAlign: 'center' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-ui-text-soft)', marginBottom: '16px' }}>library_music</span>
                            <p className="text-body" style={{ color: 'gray' }}>{t('songs.noSongs')}</p>
                        </Card>
                    ) : (
                        <>
                            <div id="songs-list-table">
                                <SongTable
                                    songs={visibleSongs}
                                    singerIdFilter={filterSinger}
                                    onSelect={handleSelectSong}
                                    selectedId={selectedSong?.id.toString()}
                                    onDelete={handleDelete}
                                />
                            </div>

                            {hasMore && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setPage(p => p + 1)}
                                        style={{ width: '240px' }}
                                    >
                                        {t('songs.loadMore')}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Quick Preview Aside */}
            {selectedSong && (
                <>
                    {/* Backdrop for mobile focus */}
                    <div
                        className="mobile-only"
                        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 100, backdropFilter: 'blur(4px)' }}
                        onClick={() => setSelectedSong(null)}
                    />
                    <aside id="song-quick-view" style={{
                        width: '400px',
                        height: 'calc(100vh - 140px)',
                        position: 'sticky',
                        top: '120px',
                        backgroundColor: 'var(--color-card-bg)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 101,
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ overflow: 'hidden' }}>
                                    <h3 className="text-card-title" style={{ margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{selectedSong.title}</h3>
                                    <p className="text-overline" style={{ margin: 0 }}>{selectedSong.artist}</p>
                                </div>
                                {selectedSong.tempo && (
                                    <div id="songs-metronome-quick">
                                        <Metronome bpm={Number(selectedSong.tempo)} variant="card" />
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <Button id="btn-full-view" variant="ghost" icon="open_in_new" onClick={() => navigate(`/worship/songs/${selectedSong.id}`)} style={{ padding: '8px', minWidth: 'auto' }} />
                                <Button variant="ghost" icon="close" onClick={() => setSelectedSong(null)} style={{ padding: '8px', minWidth: 'auto' }} />
                            </div>
                        </div>

                        {/* Transpose & Mode Controls */}
                        <div style={{ padding: '12px 20px', backgroundColor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', backgroundColor: 'var(--color-ui-surface)', borderRadius: '8px', padding: '2px', gap: '2px' }}>
                                {['american', 'spanish', 'roman', 'lyrics'].map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setViewMode(m as any)}
                                        style={{
                                            flex: 1, padding: '6px 4px', fontSize: '10px', fontWeight: 700, border: 'none', borderRadius: '6px', cursor: 'pointer',
                                            backgroundColor: viewMode === m ? 'var(--color-brand-blue)' : 'transparent',
                                            color: viewMode === m ? 'white' : 'var(--color-ui-text-soft)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {m === 'american' ? 'Am' : m === 'spanish' ? 'LA' : m === 'roman' ? 'IV' : 'TXT'}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-ui-surface)', padding: '4px', borderRadius: '8px' }}>
                                    <Button variant="ghost" icon="remove" onClick={() => setFontSize(p => Math.max(10, p - 2))} style={{ padding: '4px', height: '28px', minWidth: 'auto' }} />
                                    <span style={{ fontSize: '12px', fontWeight: 800, padding: '0 8px', color: 'var(--color-ui-text-soft)' }}>Tt</span>
                                    <Button variant="ghost" icon="add" onClick={() => setFontSize(p => Math.min(24, p + 2))} style={{ padding: '4px', height: '28px', minWidth: 'auto' }} />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--color-ui-surface)', padding: '4px', borderRadius: '8px' }}>
                                    <Button variant="ghost" icon="remove" onClick={() => setTranspose(p => p - 1)} style={{ padding: '4px', height: '28px', minWidth: 'auto' }} />
                                    <span style={{ fontSize: '12px', fontWeight: 800, minWidth: '40px', textAlign: 'center', color: 'var(--color-brand-blue)' }}>
                                        {musicUtils.formatKey(musicUtils.transposeNote(selectedSong.originalKey, transpose), viewMode === 'american' ? 'american' : 'spanish')}
                                    </span>
                                    <Button variant="ghost" icon="add" onClick={() => setTranspose(p => p + 1)} style={{ padding: '4px', height: '28px', minWidth: 'auto' }} />
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: 'var(--color-ui-bg)', borderRadius: '0 0 20px 20px' }}>
                            <ChordSheetRenderer
                                content={selectedSong.content}
                                transpose={transpose}
                                viewMode={viewMode}
                                songKey={selectedSong.originalKey}
                                fontSize={fontSize}
                            />
                        </div>
                    </aside>
                </>
            )}
        </div>
    );
};


