import { useState, useEffect, type FC, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { playlistService } from '../../../services/playlistService';
import { reunionService, type Reunion } from '../../../services/reunionService';
import { SongSelector } from '../../../components/music/SongSelector';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../context/ToastContext';
import { useTutorials } from '../../../context/TutorialContext';
import type { Playlist, Song } from '../../../types/domain';

export const Playlists: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [searchParams] = useSearchParams();
    const { user, isMaster, hasRole, canManagePlaylists } = useAuth();
    const { startTutorial, showTutorials } = useTutorials();
    
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [upcomingReunions, setUpcomingReunions] = useState<Reunion[]>([]);
    const [loading, setLoading] = useState(true);

    const churchId = searchParams.get('church_id') ? parseInt(searchParams.get('church_id')!) : null;
    const isPastor = hasRole('pastor');
    const isLeader = hasRole('leader') || hasRole('coordinator');
    const profileChurchId = user?.churchId;
    const finalChurchId = churchId || profileChurchId;

    useEffect(() => {
        if (!finalChurchId && (isPastor || isMaster)) {
            navigate('/mainhub/select-church/playlists');
            return;
        }

        const loadData = async () => {
            setLoading(true);
            try {
                const [fetchedPlaylists, reunions] = await Promise.all([
                    playlistService.getAll(finalChurchId || undefined),
                    reunionService.getUpcoming(finalChurchId || undefined)
                ]);
                setPlaylists(fetchedPlaylists);
                setUpcomingReunions(reunions);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [finalChurchId, isMaster, isPastor, navigate]);
    useEffect(() => {
        if (showTutorials && !loading && playlists.length >= 0) {
            const hasSeenTutorial = localStorage.getItem('tutorial_seen_playlists');
            if (!hasSeenTutorial) {
                if (window.confirm('¿Quieres realizar un breve recorrido por la gestión de Listados?')) {
                    startTutorial('playlists');
                }
                localStorage.setItem('tutorial_seen_playlists', 'true');
            }
        }
    }, [showTutorials, loading]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return '#10B981';
            case 'in_progress': return '#3B82F6';
            default: return '#F59E0B';
        }
    };

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSongSelectorOpen, setIsSongSelectorOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form State
    const [selectedMeetingIds, setSelectedMeetingIds] = useState<number[]>([]);
    const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
    const [customName, setCustomName] = useState('');
    const [duplicateSourceId, setDuplicateSourceId] = useState<number | null>(null);

    // Custom Dropdown State
    const [isMeetingDropdownOpen, setIsMeetingDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsMeetingDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getGeneratedName = (reunion: Reunion) => {
        const dateObj = new Date(reunion.date + 'T' + reunion.time);
        const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(dateObj);
        const capitalDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        
        const [year, month, day] = reunion.date.split('-');
        const shortYear = year.substring(2);
        const timePart = reunion.time.substring(0, 5).replace(':', '-');
        
        return `Listado - ${capitalDay}${day}-${month}-${shortYear}-${timePart}`;
    };

    const handleCreate = async () => {
        if (!finalChurchId) return;
        setIsCreating(true);
        try {
            const songIds = selectedSongs.map(s => typeof s.id === 'string' ? parseInt(s.id) : Number(s.id));
            
            if (selectedMeetingIds.length === 0) {
                if (duplicateSourceId) {
                    await playlistService.duplicate(duplicateSourceId, customName || 'Copia de listado', undefined, songIds);
                } else {
                    await playlistService.create({
                        name: customName || 'Nuevo Listado',
                        churchId: finalChurchId,
                        songs: songIds
                    });
                }
            } else {
                for (const mId of selectedMeetingIds) {
                    const r = upcomingReunions.find(x => x.id === mId);
                    const finalName = customName || (r ? getGeneratedName(r) : 'Nuevo Listado');
                    
                    if (duplicateSourceId) {
                        await playlistService.duplicate(duplicateSourceId, finalName, mId, songIds);
                    } else {
                        await playlistService.create({
                            name: finalName,
                            churchId: finalChurchId,
                            meetingIds: [mId],
                            songs: songIds
                        });
                    }
                }
            }

            setIsCreateModalOpen(false);
            resetForm();
            const fetchedPlaylists = await playlistService.getAll(finalChurchId || undefined);
            setPlaylists(fetchedPlaylists);
        } catch (error) {
            console.error('Error in playlist operation', error);
        } finally {
            setIsCreating(false);
        }
    };

    const resetForm = () => {
        setSelectedMeetingIds([]);
        setSelectedSongs([]);
        setCustomName('');
        setDuplicateSourceId(null);
        setIsMeetingDropdownOpen(false);
    };

    const handleReassign = async (playlist: Playlist) => {
        const detail = await playlistService.getById(playlist.id);
        if (detail && detail.items) {
            setSelectedSongs(detail.items.map((item: any) => item.song));
        }
        setDuplicateSourceId(playlist.id);
        setIsCreateModalOpen(true);
    };

    const toggleMeetingSelection = (id: number) => {
        setSelectedMeetingIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '300px' }}>
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <header id="playlists-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="text-h1">{t('playlists.title')}</h1>
                    <p className="text-body text-muted">{t('playlists.description')}</p>
                </div>
                {canManagePlaylists && (
                    <div id="btn-new-playlist">
                        <Button
                            label={t('playlists.newPlaylist')}
                            icon="playlist_add"
                            onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
                        />
                    </div>
                )}
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {playlists.length === 0 ? (
                    <Card style={{ padding: '40px', textAlign: 'center' }}>
                        <p className="text-muted">{t('playlists.empty')}</p>
                    </Card>
                ) : (
                    playlists.map(p => (
                        <Card key={p.id} style={{ padding: '20px' }}>
                            <div className="card-header" style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '12px', height: '12px', borderRadius: '50%',
                                        backgroundColor: getStatusColor(p.status)
                                    }} />
                                    <div>
                                        <h3 className="text-h2" style={{ margin: 0 }}>{p.name}</h3>
                                        <p className="text-small text-muted" style={{ margin: '2px 0' }}>
                                            {t(`playlists.status.${p.status}`)}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {p.isSantaCena && (
                                        <span style={{
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
                                            padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold'
                                        }}>
                                            {t('playlists.santaCena')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="card-actions" style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                    variant="secondary"
                                    style={{ flex: 1 }}
                                    icon="visibility"
                                    label={t('playlists.view')}
                                    onClick={() => navigate(`/worship/playlists/${p.id}`)}
                                />
                                {canManagePlaylists && (
                                    <Button
                                        variant="secondary"
                                        style={{ flex: 1 }}
                                        icon="content_copy"
                                        label="Reasignar"
                                        onClick={() => handleReassign(p)}
                                     />
                                 )}
                                 <Button
                                     variant="secondary"
                                     icon="ios_share"
                                     title="Compartir"
                                     onClick={() => {
                                         const shareUrl = `${window.location.origin}/worship/playlists/${p.id}`;
                                         navigator.clipboard.writeText(shareUrl);
                                         addToast('Enlace de listado copiado', 'success');
                                     }}
                                 />
                                 {isLeader && (
                                     <Button
                                         variant="secondary"
                                         icon="delete"
                                         onClick={() => {
                                             if (window.confirm(t('common.confirmDelete') || '¿Eliminar?')) {
                                                 playlistService.delete(p.id).then(() => {
                                                     playlistService.getAll(finalChurchId || undefined).then(setPlaylists);
                                                 });
                                             }
                                         }}
                                     />
                                 )}
                             </div>
                         </Card>
                     ))
                 )}
             </div>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title={duplicateSourceId ? "Reasignar Listado" : t('playlists.newPlaylist')}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '400px', maxWidth: '500px' }}>
                    
                    {/* Meeting Dropdown Multi-Select */}
                    <section>
                        <label className="text-overline" style={{ display: 'block', marginBottom: '8px' }}>
                            1. Asignar a Reuniones
                        </label>
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            <div 
                                onClick={() => setIsMeetingDropdownOpen(!isMeetingDropdownOpen)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border-subtle)',
                                    backgroundColor: 'var(--color-ui-bg)',
                                    color: 'var(--color-ui-text)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '14px'
                                }}
                            >
                                <span style={{ opacity: selectedMeetingIds.length > 0 ? 1 : 0.6 }}>
                                    {selectedMeetingIds.length > 0 
                                        ? `${selectedMeetingIds.length} reuniones seleccionadas` 
                                        : "Seleccionar reuniones..."}
                                </span>
                                <span className="material-symbols-outlined" style={{ opacity: 0.6 }}>
                                    {isMeetingDropdownOpen ? 'expand_less' : 'expand_more'}
                                </span>
                            </div>

                            {isMeetingDropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    zIndex: 100,
                                    marginTop: '4px',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    backgroundColor: 'var(--color-ui-bg)',
                                    border: '1px solid var(--color-border-subtle)',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                    padding: '8px'
                                }}>
                                    {upcomingReunions.length === 0 ? (
                                        <div style={{ padding: '12px', textAlign: 'center', opacity: 0.5, fontSize: '13px' }}>
                                            No hay reuniones próximas
                                        </div>
                                    ) : (
                                        upcomingReunions.map(r => {
                                            const d = new Date(r.date + 'T' + r.time);
                                            const dateStr = d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' });
                                            const timeStr = r.time.substring(0, 5) + 'hs';
                                            const isSelected = selectedMeetingIds.includes(r.id);
                                            
                                            return (
                                                <div 
                                                    key={r.id} 
                                                    onClick={() => toggleMeetingSelection(r.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        padding: '10px 12px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                        transition: 'background-color 0.2s',
                                                        marginBottom: '2px'
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined" style={{ 
                                                        fontSize: '20px', 
                                                        color: isSelected ? 'var(--color-brand-blue)' : 'var(--color-border-subtle)'
                                                    }}>
                                                        {isSelected ? 'check_box' : 'check_box_outline_blank'}
                                                    </span>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 400 }}>
                                                            {dateStr} {timeStr}
                                                        </span>
                                                        <span style={{ fontSize: '11px', opacity: 0.6 }}>{r.title}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Name */}
                    <section>
                        <label className="text-overline" style={{ display: 'block', marginBottom: '8px' }}>
                            2. Nombre del Listado (Opcional)
                        </label>
                        <input
                            type="text"
                            value={customName}
                            onChange={e => setCustomName(e.target.value)}
                            placeholder={selectedMeetingIds.length > 0 ? "Dejar vacío para nombre automático" : "Ej: Servicio Especial Jóvenes"}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '12px',
                                border: '1px solid var(--color-border-subtle)',
                                backgroundColor: 'var(--color-ui-bg)', color: 'var(--color-ui-text)'
                            }}
                        />
                        {selectedMeetingIds.length > 0 && !customName && (
                            <div style={{ marginTop: '8px', padding: '12px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--color-brand-blue)' }}>
                                <p className="text-small" style={{ color: 'var(--color-brand-blue)', fontWeight: 600, margin: '0 0 4px 0' }}>Nombres automáticos:</p>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', opacity: 0.8 }}>
                                    {selectedMeetingIds.slice(0, 3).map(id => {
                                        const r = upcomingReunions.find(x => x.id === id);
                                        return <li key={id}>{r ? getGeneratedName(r) : ''}</li>
                                    })}
                                    {selectedMeetingIds.length > 3 && <li>... y {selectedMeetingIds.length - 3} más</li>}
                                </ul>
                            </div>
                        )}
                    </section>

                    {/* Songs Selection */}
                    <section>
                        <label className="text-overline" style={{ display: 'block', marginBottom: '8px' }}>
                            3. Canciones ({selectedSongs.length})
                        </label>
                        <Button 
                            variant="secondary" 
                            label={selectedSongs.length > 0 ? "Cambiar Selección" : "Seleccionar Canciones"}
                            icon="music_note"
                            onClick={() => setIsSongSelectorOpen(true)}
                            style={{ width: '100%' }}
                        />
                        {selectedSongs.length > 0 && (
                            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-brand-blue)' }}>
                                {selectedSongs.slice(0, 3).map(s => s.title).join(', ')}
                                {selectedSongs.length > 3 && ` y ${selectedSongs.length - 3} más...`}
                            </div>
                        )}
                    </section>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <Button
                            variant="secondary"
                            label={t('common.cancel')}
                            style={{ flex: 1 }}
                            onClick={() => setIsCreateModalOpen(false)}
                        />
                        <Button
                            variant="primary"
                            label={isCreating ? t('common.loading') : (duplicateSourceId ? "Reasignar" : t('common.save'))}
                            style={{ flex: 1 }}
                            onClick={handleCreate}
                            disabled={isCreating || (selectedMeetingIds.length === 0 && !customName)}
                        />
                    </div>
                </div>
            </Modal>

            <SongSelector 
                isOpen={isSongSelectorOpen}
                onClose={() => setIsSongSelectorOpen(false)}
                churchId={finalChurchId || undefined}
                initialSelectedIds={selectedSongs.map(s => s.id)}
                onSelect={setSelectedSongs}
            />
        </div>
    );
};
