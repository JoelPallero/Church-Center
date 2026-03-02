import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { peopleService } from '../../../../services/peopleService';
import { useAuth } from '../../../../hooks/useAuth';
import { useToast } from '../../../../context/ToastContext';

interface TeamSettingsProps {
    team: any;
    onClose: () => void;
    onSaved: () => void;
    churchId?: number;
}

interface TeamSettingsProps {
    team: any;
    onClose: () => void;
    onSaved: () => void;
    churchId?: number;
}

const TeamSettingsModal: FC<TeamSettingsProps> = ({ team, onClose, onSaved, churchId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [allMembers, setAllMembers] = useState<any[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [name, setName] = useState(team.name || '');
    const [description, setDescription] = useState(team.description || '');
    const [leaderId, setLeaderId] = useState<number | null>(team.leader_id || null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [members, teamMembers] = await Promise.all([
                peopleService.getAll(churchId),
                peopleService.getTeamMembers(team.id, churchId)
            ]);
            setAllMembers(members);
            setSelectedMembers(teamMembers.map((m: any) => m.id));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleMember = (id: number) => {
        setSelectedMembers(prev =>
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const [updateSuccess, bulkSuccess] = await Promise.all([
                peopleService.updateGroup(team.id, { name, description, leaderId }),
                peopleService.assignTeamBulk(team.id, selectedMembers)
            ]);

            if (updateSuccess && bulkSuccess) {
                addToast(t('teams.updateSuccess') || 'Equipo actualizado correctamente', 'success');
                onSaved();
            } else {
                addToast(t('teams.updateError') || 'Error al actualizar equipo', 'error');
            }
        } catch (err) {
            addToast(t('common.error_unexpected'), 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <Card style={{ maxWidth: '700px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '24px', position: 'relative' }}>
                <header style={{ marginBottom: '20px' }}>
                    <h2 className="text-h2">{t('teams.configTitle', { name: team.name })}</h2>
                    <p className="text-body" style={{ color: 'gray' }}>{t('teams.teamInfo')}</p>
                </header>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                    {/* Team Details Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        <div>
                            <label className="text-overline">{t('teams.nameLabel')}</label>
                            <input
                                type="text"
                                className="styled-input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                style={{ width: '100%', marginTop: '4px' }}
                            />
                        </div>
                        <div>
                            <label className="text-overline">{t('teams.selectLeader')}</label>
                            <select
                                className="styled-input"
                                value={leaderId || ''}
                                onChange={e => setLeaderId(e.target.value ? parseInt(e.target.value) : null)}
                                style={{ width: '100%', marginTop: '4px' }}
                            >
                                <option value="">{t('common.no')}</option>
                                {allMembers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="text-overline">{t('teams.descLabel')}</label>
                            <textarea
                                className="styled-input"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                style={{ width: '100%', marginTop: '4px', height: '60px', resize: 'none' }}
                            />
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)', marginBottom: '24px' }} />

                    {/* Member Assignment Section */}
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="text-h3" style={{ fontSize: '18px' }}>{t('teams.memberManagement')}</h3>
                        <Button
                            variant="ghost"
                            label={t('teams.inviteMembers')}
                            icon="person_add"
                            onClick={() => navigate('/mainhub/people/invite' + (churchId || team.church_id ? `?church_id=${churchId || team.church_id}` : ''))}
                            style={{ fontSize: '13px' }}
                        />
                    </div>

                    {loading ? (
                        <div className="flex-center" style={{ height: '150px' }}><div className="spinner" /></div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                            {allMembers.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => toggleMember(m.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px',
                                        border: '1px solid var(--color-border-subtle)', cursor: 'pointer',
                                        backgroundColor: selectedMembers.includes(m.id) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                        borderColor: selectedMembers.includes(m.id) ? 'var(--color-brand-blue)' : 'var(--color-border-subtle)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '10px', height: '10px', borderRadius: '50%',
                                        border: '2px solid var(--color-brand-blue)',
                                        backgroundColor: selectedMembers.includes(m.id) ? 'var(--color-brand-blue)' : 'transparent'
                                    }} />
                                    <span className="text-body" style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border-subtle)' }}>
                    <Button variant="ghost" label={t('common.cancel')} onClick={onClose} disabled={saving} />
                    <Button variant="primary" label={saving ? t('teams.saving') : t('common.saveChanges')} onClick={handleSave} disabled={saving || loading} />
                </div>
            </Card>
        </div>
    );
};

export const TeamsList: FC = () => {
    const { t } = useTranslation();
    const { user, hasPermission, isMaster, isLoading: authLoading } = useAuth();
    const { addToast } = useToast();
    const [groups, setGroups] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [configTeam, setConfigTeam] = useState<any>(null);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamLeader, setNewTeamLeader] = useState<number | null>(null);
    const [allPotentialLeaders, setAllPotentialLeaders] = useState<any[]>([]);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const churchId = searchParams.get('church_id') ? parseInt(searchParams.get('church_id')!) : null;
    const finalChurchId = churchId || user?.churchId;
    const [churchName, setChurchName] = useState<string>('');

    useEffect(() => {
        if (authLoading) return;
        // Redirigir si no hay contexto de iglesia en absoluto
        if (!finalChurchId) {
            navigate('/mainhub/select-church/teams');
        } else {
            fetchChurchDetails();
        }
    }, [finalChurchId, navigate, authLoading]);

    const fetchChurchDetails = async () => {
        if (!finalChurchId) return;
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/churches/${finalChurchId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success && data.church) {
                setChurchName(data.church.name);
            }
        } catch (e) {
            console.error("Failed to load church name", e);
        }
    };

    const isLeader = user?.role?.name === 'leader' || user?.role?.name === 'coordinator';
    const isAdmin = isMaster || user?.role?.name === 'pastor' || user?.role?.name === 'admin';

    useEffect(() => {
        if (authLoading) return;

        if (isAdmin) {
            loadGroups();
            loadPotentialLeaders();
        } else if (isLeader) {
            loadMyTeam();
        } else if (user) {
            // If user loaded but no role recognized, stop loading
            setLoading(false);
        }
    }, [isAdmin, isLeader, finalChurchId, authLoading, user]);

    const loadPotentialLeaders = async () => {
        const data = await peopleService.getAll(finalChurchId || undefined);
        setAllPotentialLeaders(data);
    };

    const loadGroups = async () => {
        try {
            setLoading(true);
            const data = await peopleService.getGroups(finalChurchId || undefined);
            setGroups(data);
        } finally {
            setLoading(false);
        }
    };

    const loadMyTeam = async () => {
        try {
            setLoading(true);
            const data = await peopleService.getMyTeamMembers(finalChurchId || undefined);
            setMembers(data);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTeam = async () => {
        if (!newTeamName.trim()) return;
        // MUST use finalChurchId to ensure context for pastors/admins as well as superadmins
        const success = await peopleService.addGroup(newTeamName, newTeamLeader || null, null, finalChurchId || undefined);
        if (success) {
            addToast(t('teams.addSuccess') || 'Equipo creado correctamente', 'success');
            setShowAddModal(false);
            setNewTeamName('');
            setNewTeamLeader(null);
            loadGroups();
        } else {
            addToast(t('setup.teams.errorCreate') || 'Error al crear equipo', 'error');
        }
    };

    const handleDeleteTeam = async (id: number) => {
        if (!window.confirm(t('teams.deleteConfirm'))) return;
        const success = await peopleService.deleteGroup(id, finalChurchId || undefined);
        if (success) {
            addToast(t('teams.deleteSuccess') || 'Equipo eliminado correctamente', 'success');
            loadGroups();
        } else {
            addToast(t('teams.deleteError') || 'Error al eliminar equipo.', 'error');
        }
    };

    return (
        <div>
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="text-h1">{isLeader ? t('teams.myTeam') : t('nav.teams')}</h1>
                    <p className="text-body" style={{ color: 'gray' }}>
                        {churchName ? `Iglesia: ${churchName}` : (isLeader ? t('teams.manageMyTeam') : t('teams.manageAllTeams'))}
                    </p>
                </div>
                {hasPermission('teams.create') && isAdmin && (
                    <Button
                        variant="primary"
                        icon="add"
                        label={t('teams.newTeam')}
                        onClick={() => setShowAddModal(true)}
                    />
                )}
                {isLeader && (
                    <Button
                        variant="primary"
                        icon="person_add"
                        label={t('teams.inviteMember')}
                        onClick={() => navigate(`/mainhub/people/invite?church_id=${finalChurchId}`)}
                    />
                )}
            </header>

            {loading ? (
                <div className="flex-center" style={{ height: '200px' }}>
                    <div className="spinner" />
                </div>
            ) : isLeader ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {members.length === 0 ? (
                        <p className="text-body" style={{ textAlign: 'center', color: 'gray', marginTop: '40px' }}>{t('teams.emptyMyTeam')}</p>
                    ) : (
                        members.map(item => (
                            <Card key={item.id} style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '12px',
                                            backgroundColor: '#16A34A',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 'bold', color: 'white'
                                        }}>
                                            {item.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-card-title">{item.name}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <p className="text-body" style={{ color: '#94A3B8', fontSize: '13px' }}>
                                                    {item.role?.display || t('people.roles.member')}
                                                </p>
                                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#475569' }}></span>
                                                <p className="text-body" style={{ color: 'var(--color-brand-blue)', fontSize: '13px', fontWeight: 600 }}>
                                                    {item.group_name}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: item.status === 'active' ? '#10B981' : '#F59E0B',
                                        textTransform: 'uppercase'
                                    }}>
                                        {item.status}
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '8px' }}>
                    {groups.length === 0 && (
                        <Card style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
                            <p className="text-body" style={{ color: 'gray' }}>{t('teams.noTeamsInChurch') || 'No hay equipos configurados para esta iglesia.'}</p>
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    label={t('teams.createFirst') || 'Crear el primer equipo'}
                                    onClick={() => setShowAddModal(true)}
                                    style={{ marginTop: '12px' }}
                                />
                            )}
                        </Card>
                    )}
                    {groups.map(group => (
                        <Card key={group.id} style={{ padding: '20px', position: 'relative' }}>
                            {hasPermission('teams.delete') && (
                                <button
                                    onClick={() => handleDeleteTeam(group.id)}
                                    style={{
                                        position: 'absolute', top: '12px', right: '12px',
                                        background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444'
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                </button>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: '24px' }}>
                                <div>
                                    <h3 className="text-card-title">{group.name}</h3>
                                    {group.leader_name && (
                                        <p className="text-body" style={{ color: 'var(--color-brand-blue)', marginTop: '4px', fontSize: '13px', fontWeight: 600 }}>
                                            {t('teams.leaderLabel', { name: group.leader_name })}
                                        </p>
                                    )}
                                    <p className="text-body" style={{ color: 'gray', marginTop: group.leader_name ? '4px' : '8px', fontSize: '14px' }}>
                                        {group.description || (group.leader_name ? '' : t('teams.noDescription'))}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)' }}>
                                    {group.is_service_team ? 'diversity_3' : 'group'}
                                </span>
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                                {hasPermission('teams.edit') && (
                                    <Button variant="secondary" onClick={() => setConfigTeam(group)} style={{ flex: 1, fontSize: '12px', padding: '8px' }}>
                                        {t('common.configure')}
                                    </Button>
                                )}
                                <Button variant="secondary" style={{ flex: 1, fontSize: '12px', padding: '8px' }}>
                                    {t('teams.viewMembers')}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {showAddModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <Card style={{ maxWidth: '400px', width: '90%', padding: '24px' }}>
                        <h2 className="text-h2" style={{ marginBottom: '16px' }}>{t('teams.newTeamTitle')}</h2>
                        <input
                            type="text"
                            placeholder={t('teams.teamNamePlaceholder')}
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)',
                                backgroundColor: 'var(--color-ui-bg)', color: 'var(--color-ui-text)', marginBottom: '12px'
                            }}
                        />
                        <select
                            value={newTeamLeader || ''}
                            onChange={(e) => setNewTeamLeader(e.target.value ? parseInt(e.target.value) : null)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)',
                                backgroundColor: 'var(--color-ui-bg)', color: 'var(--color-ui-text)', marginBottom: '20px'
                            }}
                        >
                            <option value="">{t('teams.selectLeader')}</option>
                            {allPotentialLeaders.map((m: any) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <Button variant="ghost" label={t('common.cancel')} onClick={() => setShowAddModal(false)} />
                            <Button variant="primary" label={t('teams.createAction')} onClick={handleAddTeam} />
                        </div>
                    </Card>
                </div>
            )}

            {configTeam && (
                <TeamSettingsModal
                    team={configTeam}
                    churchId={finalChurchId || undefined}
                    onClose={() => setConfigTeam(null)}
                    onSaved={() => {
                        setConfigTeam(null);
                        loadGroups();
                    }}
                />
            )}
        </div>
    );
};



