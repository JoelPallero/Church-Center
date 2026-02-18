import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { songService } from '../../../services/songService';
import { useAuth } from '../../../hooks/useAuth';
import type { Song } from '../../../services/songService';
import { SongCard } from '../../../components/music/SongCard';
import { peopleService } from '../../../services/peopleService';
import type { User } from '../../../types/domain';

export const SongList: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [singers, setSingers] = useState<User[]>([]);

    // Pagination
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 20;

    // Advanced Filters
    const [filterKey, setFilterKey] = useState('');
    const [filterType, setFilterType] = useState<'' | 'fast' | 'slow'>('');
    const [filterSinger, setFilterSinger] = useState<number | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadSongs();
        loadSingers();
    }, []);

    const loadSingers = async () => {
        const data = await peopleService.getAll();
        setSingers(data);
    };

    const loadSongs = async () => {
        try {
            if (songs.length === 0) setLoading(true);
            const data = await songService.getAll();
            setSongs(data);
        } finally {
            setLoading(false);
        }
    };

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

        // 5. Alpha Sort
        list.sort((a, b) => a.title.localeCompare(b.title));

        return list;
    };

    const allFilteredSongs = getDisplaySongs();
    const visibleSongs = allFilteredSongs.slice(0, page * PAGE_SIZE);
    const hasMore = allFilteredSongs.length > (page * PAGE_SIZE);

    return (
        <div>
            <header style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h1 className="text-h1">{t('songs.title')}</h1>
                    {hasPermission('songs.create') && (
                        <Button
                            variant="primary"
                            icon="add"
                            label={t('songs.add')}
                            onClick={() => navigate('/songs/new')}
                        />
                    )}
                </div>

                <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
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
                    <Card style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                        <div>
                            <label className="text-overline text-muted" style={{ display: 'block', marginBottom: '4px' }}>{t('songs.key')}</label>
                            <select
                                value={filterKey}
                                onChange={e => { setFilterKey(e.target.value); setPage(1); }}
                                style={{ width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: 'var(--color-ui-bg)', color: 'var(--color-ui-text)', border: '1px solid var(--color-border-subtle)', outline: 'none', fontSize: '13px' }}
                            >
                                <option value="">{t('common.all')}</option>
                                {['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'].map(k => (
                                    <option key={k} value={k}>{k}</option>
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

            <div style={{ display: 'grid', gap: '8px' }}>
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
                            />
                        ))}

                        {hasMore && (
                            <Button
                                variant="secondary"
                                onClick={() => setPage(p => p + 1)}
                                style={{ marginTop: '12px', width: '100%' }}
                            >
                                Cargar más canciones
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};


