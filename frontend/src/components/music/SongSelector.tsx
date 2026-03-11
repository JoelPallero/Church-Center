import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { songService, type Song } from '../../services/songService';
import { musicUtils } from '../../utils/musicUtils';

interface SongSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (selectedSongs: Song[]) => void;
    initialSelectedIds?: (number | string)[];
    churchId?: number;
}

export const SongSelector: FC<SongSelectorProps> = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    initialSelectedIds = [],
    churchId
}) => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadSongs();
            setSelectedIds(initialSelectedIds);
        }
    }, [isOpen]);

    const loadSongs = async () => {
        setLoading(true);
        try {
            const data = await songService.getAll(churchId);
            setSongs(data);
        } finally {
            setLoading(false);
        }
    };

    const toggleSong = (songId: number | string) => {
        setSelectedIds(prev => 
            prev.includes(songId) 
                ? prev.filter(id => id !== songId) 
                : [...prev, songId]
        );
    };

    const handleConfirm = () => {
        const selectedSongs = songs.filter(s => selectedIds.includes(s.id));
        onSelect(selectedSongs);
        onClose();
    };

    const filteredSongs = songs.filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Canciones">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '400px', maxWidth: '90vw', maxHeight: '70vh' }}>
                <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ 
                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', 
                        fontSize: '20px', color: 'gray' 
                    }}>search</span>
                    <input 
                        type="text" 
                        placeholder="Buscar por título o artista..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ 
                            width: '100%', padding: '10px 10px 10px 40px', borderRadius: '12px', 
                            border: '1px solid var(--color-border-subtle)', outline: 'none' 
                        }}
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '20px' }}>Cargando repertorio...</p>
                    ) : filteredSongs.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '20px', color: 'gray' }}>No se encontraron canciones</p>
                    ) : (
                        filteredSongs.map(song => {
                            const isSelected = selectedIds.includes(song.id);
                            return (
                                <div 
                                    key={song.id}
                                    onClick={() => toggleSong(song.id)}
                                    style={{ 
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                                        borderRadius: '12px', cursor: 'pointer',
                                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--color-ui-bg)',
                                        border: isSelected ? '1px solid var(--color-brand-blue)' : '1px solid transparent',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ 
                                        width: '20px', height: '20px', borderRadius: '4px',
                                        border: '2px solid var(--color-brand-blue)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: isSelected ? 'var(--color-brand-blue)' : 'transparent'
                                    }}>
                                        {isSelected && <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '16px' }}>check</span>}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{song.title}</p>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'gray' }}>{song.artist} • {musicUtils.formatKey(song.originalKey)}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div style={{ display: 'flex', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--color-border-subtle)' }}>
                    <Button label="Cancelar" variant="secondary" onClick={onClose} style={{ flex: 1 }} />
                    <Button 
                        label={`Agregar ${selectedIds.length} canciones`} 
                        variant="primary" 
                        onClick={handleConfirm} 
                        style={{ flex: 1 }}
                        disabled={selectedIds.length === 0}
                    />
                </div>
            </div>
        </Modal>
    );
};
