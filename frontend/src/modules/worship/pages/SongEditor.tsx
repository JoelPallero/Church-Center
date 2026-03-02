import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { songService } from '../../../services/songService';
import type { Song, MemberKey, User } from '../../../types/domain';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../context/ToastContext';

import { peopleService } from '../../../services/peopleService';

const MUSICAL_KEYS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const SongEditor: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const isEditing = !!id && id !== 'new';

    const [form, setForm] = useState<Omit<Song, 'id' | 'churchId'>>({
        title: '',
        artist: '',
        originalKey: 'C',
        tempo: 120,
        timeSignature: '4/4',
        content: '',
        category: 'worship',
        bpmType: 'fast',
        memberKeys: []
    });

    const [loading, setLoading] = useState(false);
    const { user, isMaster } = useAuth();
    const { addToast } = useToast();
    const [singers, setSingers] = useState<User[]>([]);

    const churchIdFromUrl = searchParams.get('church_id') ? parseInt(searchParams.get('church_id')!) : null;
    const isPastor = user?.role?.name === 'pastor';
    const finalChurchId = churchIdFromUrl || user?.churchId;

    useEffect(() => {
        // Redirect if no church context and NOT a Master user (who can create global songs)
        if (!finalChurchId && !isMaster && isPastor) {
            navigate('/mainhub/select-church/songs');
            return;
        }

        peopleService.getAll(finalChurchId || undefined).then(setSingers);
    }, [finalChurchId, isMaster, isPastor, navigate]);

    useEffect(() => {
        if (isEditing) {
            loadSong();
        }
    }, [id]);

    const loadSong = async () => {
        const song = await songService.getById(id!, finalChurchId || undefined);
        if (song) {
            setForm({
                title: song.title,
                artist: song.artist,
                originalKey: song.originalKey,
                tempo: song.tempo || 120,
                timeSignature: song.timeSignature || '4/4',
                content: song.content,
                category: song.category || 'worship',
                bpmType: song.bpmType || 'fast',
                memberKeys: song.memberKeys || []
            });
        }
    };

    const addMemberKey = () => {
        if (singers.length === 0) {
            addToast(t('people.noSingers') || 'No hay cantantes registrados para asignar.', 'warning');
            return;
        }
        const firstAvailableSinger = singers[0];
        const newAssignment: MemberKey = {
            songId: id || 'new',
            memberId: firstAvailableSinger.id,
            memberName: firstAvailableSinger.name,
            preferredKey: form.originalKey
        };
        setForm({ ...form, memberKeys: [...(form.memberKeys || []), newAssignment] });
    };

    const removeMemberKey = (index: number) => {
        const updated = [...(form.memberKeys || [])];
        updated.splice(index, 1);
        setForm({ ...form, memberKeys: updated });
    };

    const updateMemberKey = (index: number, field: keyof MemberKey, value: any) => {
        const updated = [...(form.memberKeys || [])];
        const item = { ...updated[index], [field]: value };

        if (field === 'memberId') {
            const singer = singers.find(s => s.id === parseInt(value));
            item.memberName = singer?.name || '';
        }

        updated[index] = item;
        setForm({ ...form, memberKeys: updated });
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // Direct edit bypass for Master, Pastor, Leader
            const isAuthorizedToDirectEdit =
                (user.role?.level !== undefined && user.role.level <= 30);

            if (isEditing) {
                if (isAuthorizedToDirectEdit) {
                    await songService.update(id!, form);
                    addToast(t('songs.saveSuccess') || 'Cambios guardados correctamente.', 'success');
                } else {
                    // Members must submit for approval
                    await songService.submitEdit({
                        songId: id!,
                        memberId: user.id,
                        proposedTitle: form.title,
                        proposedArtist: form.artist,
                        proposedContent: form.content,
                        proposedKey: form.originalKey,
                        proposedTempo: form.tempo,
                        proposedTimeSignature: form.timeSignature,
                        proposedBpmType: form.bpmType
                    });
                    addToast(t('songs.submitApprovalSuccess') || 'Tus cambios han sido enviados para revisión por un líder.', 'success');
                }
            } else {
                // New songs likewise: leaders add directly, members submit?
                // For now, let's allow adding directly or keep it simple
                await songService.add(form, finalChurchId || undefined);
                addToast(t('songs.addSuccess') || 'Canción añadida correctamente.', 'success');
            }
            navigate('/worship/songs' + (finalChurchId ? `?church_id=${finalChurchId}` : ''));
        } catch (error: any) {
            console.error('Save failed', error);
            if (error.response?.status === 403) {
                addToast(t('songs.forbiddenEdit') || 'No tienes permisos para editar esta canción directamente.', 'error');
            } else {
                addToast(t('common.error') || 'Ocurrió un error al guardar.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
            <style>{`
                .editor-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 24px;
                }
                @media (min-width: 768px) {
                    .editor-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                }
            `}</style>
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="text-h1">{isEditing ? t('songs.edit') : t('songs.add')}</h1>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" label={t('common.cancel')} onClick={() => navigate(-1)} />
                    <Button variant="primary" label={loading ? t('common.save') + '...' : t('common.save')} onClick={handleSave} disabled={loading} />
                </div>
            </header>

            <div className="editor-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                            <label className="text-overline" style={{ color: 'gray', marginBottom: '4px', display: 'block' }}>{t('songs.titleLabel')}</label>
                            <input
                                className="text-body"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                style={inputStyle}
                                placeholder={t('songs.titlePlaceholder')}
                            />
                        </div>
                        <div>
                            <label className="text-overline" style={{ color: 'gray', marginBottom: '4px', display: 'block' }}>{t('songs.artistLabel')}</label>
                            <input
                                className="text-body"
                                value={form.artist}
                                onChange={e => setForm({ ...form, artist: e.target.value })}
                                style={inputStyle}
                                placeholder={t('songs.artistPlaceholder')}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label className="text-overline" style={{ color: 'gray', marginBottom: '4px', display: 'block' }}>{t('songs.key')}</label>
                                <select
                                    className="text-body"
                                    value={form.originalKey}
                                    onChange={e => setForm({ ...form, originalKey: e.target.value })}
                                    style={inputStyle}
                                >
                                    {MUSICAL_KEYS.map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-overline" style={{ color: 'gray', marginBottom: '4px', display: 'block' }}>{t('songs.typeLabel')}</label>
                                <select
                                    className="text-body"
                                    value={form.bpmType || 'fast'}
                                    onChange={e => setForm({ ...form, bpmType: e.target.value as 'fast' | 'slow' })}
                                    style={inputStyle}
                                >
                                    <option value="fast">{t('songs.fast')}</option>
                                    <option value="slow">{t('songs.slow')}</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label className="text-overline" style={{ color: 'gray', marginBottom: '4px', display: 'block' }}>{t('songs.tempo')} (BPM)</label>
                                <input
                                    type="number"
                                    className="text-body"
                                    value={form.tempo}
                                    onChange={e => setForm({ ...form, tempo: parseInt(e.target.value) })}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label className="text-overline" style={{ color: 'gray', marginBottom: '4px', display: 'block' }}>{t('songs.time')}</label>
                                <select
                                    className="text-body"
                                    value={form.timeSignature}
                                    onChange={e => setForm({ ...form, timeSignature: e.target.value })}
                                    style={inputStyle}
                                >
                                    {['4/4', '3/4', '6/8', '2/4', '2/2', '5/4', '12/8'].map(ts => (
                                        <option key={ts} value={ts}>{ts}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </Card>

                    <Card style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <label className="text-overline" style={{ color: 'gray' }}>{t('songs.singerAssignments')}</label>
                            <Button variant="ghost" label={t('songs.addAssignment')} onClick={addMemberKey} style={{ padding: '4px 8px', fontSize: '11px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                                {t('common.add')}
                            </Button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {form.memberKeys && form.memberKeys.map((mk, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--color-ui-bg)', padding: '8px', borderRadius: '8px' }}>
                                    <select
                                        className="text-body"
                                        value={mk.memberId}
                                        onChange={e => updateMemberKey(idx, 'memberId', e.target.value)}
                                        style={{ ...inputStyle, flex: 2, padding: '6px 8px' }}
                                    >
                                        {singers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <select
                                        className="text-body"
                                        value={mk.preferredKey}
                                        onChange={e => updateMemberKey(idx, 'preferredKey', e.target.value)}
                                        style={{ ...inputStyle, flex: 1, padding: '6px 8px' }}
                                    >
                                        {MUSICAL_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                    <button
                                        onClick={() => removeMemberKey(idx)}
                                        style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px' }}
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            ))}
                            {(!form.memberKeys || form.memberKeys.length === 0) && (
                                <p style={{ fontSize: '12px', color: 'gray', textAlign: 'center', margin: '8px 0' }}>{t('songs.noSingersAssigned')}</p>
                            )}
                        </div>
                    </Card>

                    <Card style={{ padding: '20px' }}>
                        <label className="text-overline" style={{ color: 'gray', marginBottom: '8px', display: 'block' }}>{t('songs.contentLabel')}</label>
                        <textarea
                            className="text-body"
                            value={form.content}
                            onChange={e => setForm({ ...form, content: e.target.value })}
                            style={{
                                ...inputStyle,
                                minHeight: '300px',
                                fontFamily: 'monospace',
                                resize: 'vertical'
                            }}
                            placeholder={t('songs.contentPlaceholder')}
                        />
                    </Card>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Card style={{ padding: '20px', minHeight: '500px', backgroundColor: 'var(--color-ui-surface)' }}>
                        <label className="text-overline" style={{ color: 'gray', marginBottom: '16px', display: 'block' }}>{t('common.preview')}</label>
                        <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '2', color: 'var(--color-ui-text)' }}>
                            {form.content ? form.content.split('\n').map((line, i) => (
                                <p key={i} style={{ margin: 0 }}>
                                    {line.split(/(\[[^\]]+\])/).map((part, j) => (
                                        part.startsWith('[') ? (
                                            <span key={j} style={{ position: 'relative', display: 'inline-flex', width: 0, overflow: 'visible' }}>
                                                <strong style={{
                                                    position: 'absolute',
                                                    bottom: '100%',
                                                    left: 0,
                                                    color: 'var(--color-primary)',
                                                    whiteSpace: 'nowrap',
                                                    transform: 'translateY(10%)'
                                                }}>
                                                    {part.slice(1, -1)}
                                                </strong>
                                            </span>
                                        ) : part
                                    ))}
                                </p>
                            )) : <span style={{ color: '#ccc' }}>{t('songs.previewPlaceholder')}</span>}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border-subtle)',
    backgroundColor: 'var(--color-ui-bg)',
    color: 'var(--color-ui-text)',
    fontSize: '14px',
    outline: 'none'
};


