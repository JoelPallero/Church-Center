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
        youtubeUrl: '',
        spotifyUrl: '',
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
                youtubeUrl: song.youtubeUrl || '',
                spotifyUrl: (song as any).spotifyUrl || '',
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
        <div style={{ width: '100%', padding: '24px', minWidth: 0 }}>
            <style>{`
                .editor-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 24px;
                    align-items: start;
                }
                @media (min-width: 1200px) {
                    .editor-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }
                @media (min-width: 768px) and (max-width: 1199px) {
                    .editor-grid {
                        grid-template-columns: 1fr 1fr;
                    }
                }
            `}</style>
            <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Button variant="ghost" icon="arrow_back" label={t('common.back') || 'Volver'} onClick={() => navigate(-1)} style={{ marginBottom: '8px', padding: 0 }} />
                    <h1 className="text-h1">{isEditing ? t('songs.edit') : t('songs.add')}</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button variant="secondary" label={t('common.cancel')} onClick={() => navigate(-1)} />
                    <Button variant="primary" label={loading ? t('common.save') + '...' : t('common.save')} onClick={handleSave} disabled={loading} />
                </div>
            </header>

            <div className="editor-grid">
                {/* Column 1: Config & Resource Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Card style={{ padding: '24px' }}>
                        <h3 className="text-card-title" style={{ marginBottom: '16px' }}>{t('songs.basicInfo') || 'Información Básica'}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label className="text-overline" style={{ color: 'var(--color-ui-text-soft)', marginBottom: '6px', display: 'block' }}>{t('songs.title') || 'Título'}</label>
                                <input className="text-body" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder={t('songs.titlePlaceholder') || 'Nombre de la canción'} />
                            </div>
                            <div>
                                <label className="text-overline" style={{ color: 'var(--color-ui-text-soft)', marginBottom: '6px', display: 'block' }}>{t('songs.artist') || 'Artista'}</label>
                                <input className="text-body" value={form.artist} onChange={e => setForm({ ...form, artist: e.target.value })} style={inputStyle} placeholder={t('songs.artistPlaceholder') || 'Nombre del artista/grupo'} />
                            </div>
                        </div>
                    </Card>

                    <Card style={{ padding: '24px' }}>
                        <h3 className="text-card-title" style={{ marginBottom: '16px' }}>{t('songs.technical') || 'Detalles Técnicos'}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label className="text-overline" style={{ color: 'var(--color-ui-text-soft)', marginBottom: '6px', display: 'block' }}>{t('songs.key') || 'Tonalidad'}</label>
                                    <select className="text-body" value={form.originalKey} onChange={e => setForm({ ...form, originalKey: e.target.value })} style={inputStyle}>
                                        {MUSICAL_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-overline" style={{ color: 'var(--color-ui-text-soft)', marginBottom: '6px', display: 'block' }}>{t('songs.bpmType') || 'Tipo BPM'}</label>
                                    <select className="text-body" value={form.bpmType || 'fast'} onChange={e => setForm({ ...form, bpmType: e.target.value as 'fast' | 'slow' })} style={inputStyle}>
                                        <option value="fast">{t('songs.fast') || 'Rápida'}</option>
                                        <option value="slow">{t('songs.slow') || 'Lenta'}</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label className="text-overline" style={{ color: 'var(--color-ui-text-soft)', marginBottom: '6px', display: 'block' }}>BPM</label>
                                    <input type="number" className="text-body" value={form.tempo} onChange={e => setForm({ ...form, tempo: parseInt(e.target.value) })} style={inputStyle} />
                                </div>
                                <div>
                                    <label className="text-overline" style={{ color: 'var(--color-ui-text-soft)', marginBottom: '6px', display: 'block' }}>{t('songs.time') || 'Compás'}</label>
                                    <select className="text-body" value={form.timeSignature} onChange={e => setForm({ ...form, timeSignature: e.target.value })} style={inputStyle}>
                                        {['4/4', '3/4', '6/8', '2/4', '2/2', '5/4', '12/8'].map(ts => <option key={ts} value={ts}>{ts}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card style={{ padding: '24px' }}>
                        <h3 className="text-card-title" style={{ marginBottom: '16px' }}>{t('songs.multimedia') || 'Multimedia'}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label className="text-overline" style={{ color: 'var(--color-ui-text-soft)', marginBottom: '6px', display: 'block' }}>YouTube Link</label>
                                <div style={{ position: 'relative' }}>
                                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#FF0000', fontSize: '18px' }}>smart_display</span>
                                    <input className="text-body" value={form.youtubeUrl} onChange={e => setForm({ ...form, youtubeUrl: e.target.value })} style={{ ...inputStyle, paddingLeft: '40px' }} placeholder="https://youtube.com/..." />
                                </div>
                            </div>
                            <div>
                                <label className="text-overline" style={{ color: 'var(--color-ui-text-soft)', marginBottom: '6px', display: 'block' }}>Spotify Link</label>
                                <div style={{ position: 'relative' }}>
                                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#1DB954', fontSize: '18px' }}>album</span>
                                    <input className="text-body" value={(form as any).spotifyUrl} onChange={e => setForm({ ...form, ['spotifyUrl' as any]: e.target.value })} style={{ ...inputStyle, paddingLeft: '40px' }} placeholder="https://spotify.com/..." />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Column 2: Singer Assignments & Editor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Card style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 className="text-card-title" style={{ fontSize: '14px' }}>{t('songs.singerAssignments') || 'Líder de Alabanza'}</h3>
                            <Button variant="ghost" icon="add" onClick={addMemberKey} style={{ padding: '4px', minWidth: 'auto' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {form.memberKeys && form.memberKeys.map((mk, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center', backgroundColor: 'var(--color-ui-surface)', padding: '8px', borderRadius: '10px' }}>
                                    <select className="text-body" value={mk.memberId} onChange={e => updateMemberKey(idx, 'memberId', e.target.value)} style={{ ...inputStyle, flex: 2, padding: '4px 8px', fontSize: '12px' }}>
                                        {singers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <select className="text-body" value={mk.preferredKey} onChange={e => updateMemberKey(idx, 'preferredKey', e.target.value)} style={{ ...inputStyle, flex: 1, padding: '4px 4px', fontSize: '12px' }}>
                                        {MUSICAL_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                    <button onClick={() => removeMemberKey(idx)} style={{ background: 'none', border: 'none', color: 'var(--color-danger-red)', cursor: 'pointer', padding: '2px' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                    </button>
                                </div>
                            ))}
                            {(!form.memberKeys || form.memberKeys.length === 0) && (
                                <p className="text-body-secondary" style={{ textAlign: 'center', fontSize: '12px' }}>{t('songs.noSingersAssigned')}</p>
                            )}
                        </div>
                    </Card>

                    <Card style={{ padding: '24px', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                            <label className="text-overline" style={{ color: 'var(--color-ui-text-soft)', margin: 0 }}>{t('songs.contentLabel')}</label>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {[
                                    { n: 'Intro', c: '#6B7280' },
                                    { n: 'Estrofa', c: '#3B82F6' },
                                    { n: 'Coro', c: '#10B981' },
                                    { n: 'Puente', c: '#F59E0B' },
                                    { n: 'Outro', c: '#EF4444' }
                                ].map(s => (
                                    <button
                                        key={s.n}
                                        onClick={() => {
                                            const textarea = document.getElementById('song-content-area') as HTMLTextAreaElement;
                                            if (!textarea) return;
                                            const start = textarea.selectionStart;
                                            const end = textarea.selectionEnd;
                                            const text = form.content;

                                            // Check if we are at start or need a prefix newline
                                            const needsPrefix = start > 0 && text[start - 1] !== '\n';
                                            const tag = `${needsPrefix ? '\n' : ''}[${s.n}]\n`;

                                            const before = text.substring(0, start);
                                            const after = text.substring(end);
                                            setForm({ ...form, content: before + tag + after });

                                            setTimeout(() => {
                                                textarea.focus();
                                                const cursorFixed = start + tag.length;
                                                textarea.setSelectionRange(cursorFixed, cursorFixed);
                                            }, 10);
                                        }}
                                        type="button"
                                        style={{
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '4px 10px',
                                            fontSize: '10px',
                                            fontWeight: 400,
                                            backgroundColor: s.c,
                                            color: 'white',
                                            cursor: 'pointer',
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        {s.n}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <textarea
                            id="song-content-area"
                            className="text-body"
                            value={form.content}
                            onChange={e => setForm({ ...form, content: e.target.value })}
                            style={{
                                ...inputStyle,
                                flex: 1,
                                minHeight: '500px',
                                fontFamily: 'monospace',
                                resize: 'none',
                                lineHeight: '1.6',
                                padding: '20px'
                            }}
                            placeholder={t('songs.contentPlaceholder')}
                        />
                    </Card>
                </div>

                {/* Column 3: Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <Card style={{ padding: '24px' }}>
                        <h3 className="text-card-title" style={{ marginBottom: '16px' }}>{t('common.preview')}</h3>
                        <div style={{
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.8',
                            color: 'var(--color-ui-text)',
                            fontSize: '11px',
                            maxHeight: '800px',
                            overflowY: 'auto',
                            backgroundColor: 'var(--color-ui-bg)',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid var(--color-border-subtle)'
                        }}>
                            {form.content ? form.content.split('\n').map((line, i) => (
                                <p key={i} style={{ margin: 0 }}>
                                    {line.split(/(\[[^\]]+\])/).map((part, j) => (
                                        part.startsWith('[') ? (
                                            <span key={j} style={{ position: 'relative', display: 'inline-flex', width: 0, overflow: 'visible' }}>
                                                <strong style={{ position: 'absolute', bottom: '100%', left: 0, color: 'var(--color-brand-blue)', whiteSpace: 'nowrap', transform: 'translateY(10%)' }}>
                                                    {part.slice(1, -1)}
                                                </strong>
                                            </span>
                                        ) : part
                                    ))}
                                </p>
                            )) : <span style={{ color: 'var(--color-ui-text-soft)' }}>{t('songs.previewPlaceholder')}</span>}
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


