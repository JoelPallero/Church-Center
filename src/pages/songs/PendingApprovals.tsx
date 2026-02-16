import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { songService } from '../../services/songService';
import type { SongEdit, Song } from '../../types/domain';

export const PendingApprovals: FC = () => {
    const { t } = useTranslation();
    const [edits, setEdits] = useState<SongEdit[]>([]);
    const [songs, setSongs] = useState<Record<string, Song>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [pendingEdits, allSongs] = await Promise.all([
            songService.getPendingEdits(),
            songService.getAll()
        ]);

        const songMap: Record<string, Song> = {};
        allSongs.forEach(s => { songMap[s.id.toString()] = s; });

        setSongs(songMap);
        setEdits(pendingEdits);
        setLoading(false);
    };

    const handleApprove = async (editId: number) => {
        if (confirm(t('songs.moderation.approveConfirm'))) {
            const success = await songService.approveEdit(editId);
            if (success) {
                setEdits(edits.filter(e => e.id !== editId));
            }
        }
    };

    const handleReject = async (editId: number) => {
        const notes = prompt(t('songs.moderation.rejectionReason'));
        if (notes !== null) {
            const success = await songService.rejectEdit(editId, notes);
            if (success) {
                setEdits(edits.filter(e => e.id !== editId));
            }
        }
    };

    if (loading) return <div style={{ textAlign: 'center' }}>{t('common.loading')}</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
            <header style={{ marginBottom: '24px' }}>
                <h1 className="text-h1">{t('songs.moderation.title')}</h1>
                <p className="text-body" style={{ color: 'gray' }}>{t('songs.moderation.subtitle')}</p>
            </header>

            {edits.length === 0 ? (
                <Card style={{ padding: '40px', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}>check_circle</span>
                    <p className="text-body" style={{ color: 'gray' }}>{t('songs.moderation.empty')}</p>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {edits.map(edit => {
                        const original = songs[edit.songId.toString()];
                        return (
                            <Card key={edit.id} style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div>
                                        <h3 className="text-card-title" style={{ margin: 0 }}>{original?.title || t('songs.notFound')}</h3>
                                        <p className="text-overline" style={{ color: 'var(--color-brand-blue)', marginTop: '4px' }}>
                                            {t('songs.moderation.proposedBy', {
                                                name: `Usuario ID ${edit.memberId}`,
                                                date: new Date(edit.createdAt).toLocaleDateString()
                                            })}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Button variant="secondary" label={t('songs.moderation.reject')} onClick={() => handleReject(edit.id)} style={{ color: '#ff4444' }} />
                                        <Button variant="primary" label={t('songs.moderation.approve')} onClick={() => handleApprove(edit.id)} />
                                    </div>
                                </div>

                                <div className="diff-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', backgroundColor: 'var(--color-ui-bg)', padding: '16px', borderRadius: '8px' }}>
                                    <div>
                                        <label className="text-overline" style={{ color: 'gray', display: 'block', marginBottom: '8px' }}>{t('songs.moderation.currentVersion')}</label>
                                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px', fontFamily: 'monospace', opacity: 0.7 }}>
                                            {original?.content || '(Sin contenido)'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-overline" style={{ color: 'var(--color-brand-blue)', display: 'block', marginBottom: '8px' }}>{t('songs.moderation.proposedVersion')}</label>
                                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '13px', fontFamily: 'monospace', color: 'var(--color-ui-text)' }}>
                                            {edit.proposedContent || original?.content}
                                        </div>
                                        {(edit.proposedKey && edit.proposedKey !== original?.originalKey) && (
                                            <p style={{ fontSize: '12px', marginTop: '12px' }}>
                                                {t('songs.moderation.keyChange', { from: original?.originalKey, to: edit.proposedKey })}
                                            </p>
                                        )}
                                        {(edit.proposedTempo && edit.proposedTempo !== original?.tempo) && (
                                            <p style={{ fontSize: '12px' }}>
                                                {t('songs.moderation.tempoChange', { from: original?.tempo, to: edit.proposedTempo })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
