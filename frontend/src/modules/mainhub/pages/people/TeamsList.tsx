import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { peopleService } from '../../../../services/peopleService';
import { useAuth } from '../../../../hooks/useAuth';
import { useToast } from '../../../../context/ToastContext';
import { useConfirm } from '../../../../context/ConfirmContext';

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
    const { user, hasPermission, hasRole, isMaster, isLoading: authLoading } = useAuth();
    const { addToast } = useToast();
    const confirm = useConfirm();
    const [groups, setGroups] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [configTeam, setConfigTeam] = useState<any>(null);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamLeader, setNewTeamLeader] = useState<number | null>(null);
    const [allPotentialLeaders, setAllPotentialLeaders] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [newTeamArea, setNewTeamArea] = useState<number | null>(null);
    const [isNewLeader, setIsNewLeader] = useState(false);
    const [newLeaderName, setNewLeaderName] = useState('');
    const [newLeaderEmail, setNewLeaderEmail] = useState('');
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

    const isLeader = hasRole('leader') || hasRole('coordinator');
    // All pastors and superadmins are considered admins here. 
    // If we want leaders/coordinators to create teams, we add them to the condition based on the permission matrix rule.
    // 'action.team.create': ['superadmin', 'pastor', 'leader'] is permitted in permissionsConfig.ts, so we let 'team.create' dictate the button. 
    // Wait, the button rendering checks `hasPermission('team.create') && isAdmin`
    // So making isAdmin true for leaders too allows the permission check to do its job.
    const isAdmin = isMaster || hasRole('pastor') || hasRole('admin') || isLeader;
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
        const [leadersData, areasData] = await Promise.all([
            peopleService.getAll(finalChurchId || undefined),
            peopleService.getAreas(finalChurchId || undefined)
        ]);
        setAllPotentialLeaders(leadersData);
        setAreas(areasData);
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

        if (isNewLeader && (!newLeaderName.trim() || !newLeaderEmail.trim())) {
            addToast('Por favor ingrese el nombre y correo electrónico del nuevo líder.', 'error');
            return;
        }

        let finalLeaderId = newTeamLeader;
        setLoading(true);

        if (isNewLeader) {
            // Role ID 3 = Leader
            const newLeaderId = await peopleService.invite(newLeaderName, newLeaderEmail, 3, finalChurchId || undefined);
            if (!newLeaderId) {
                addToast('Error al crear el nuevo líder. El correo podría estar en uso.', 'error');
                setLoading(false);
                return;
            }
            finalLeaderId = newLeaderId;
        }

        const success = await peopleService.addGroup(newTeamName, finalLeaderId || null, newTeamArea, finalChurchId || undefined);
        if (success) {
            addToast(t('teams.addSuccess') || 'Equipo creado correctamente', 'success');
            setShowAddModal(false);
            setNewTeamName('');
            setNewTeamLeader(null);
            setNewTeamArea(null);
            setIsNewLeader(false);
            setNewLeaderName('');
            setNewLeaderEmail('');
            loadGroups();
        } else {
            addToast(t('setup.teams.errorCreate') || 'Error al crear equipo', 'error');
            setLoading(false);
        }
    };

    const handleDeleteTeam = async (id: number) => {
        const confirmed = await confirm({
            title: t('teams.deleteTitle') || 'Eliminar Equipo',
            message: t('teams.deleteConfirm'),
            variant: 'danger',
            confirmText: 'Eliminar'
        });
        if (!confirmed) return;
        
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
            <header style={{
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
                    <h1 className="text-h1" style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 32px)', lineHeight: 1.2 }}>{t('nav.teams')}</h1>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {hasPermission('team.create') && isAdmin && (
                            <Button
                                variant="primary"
                                icon="add"
                                label={t('teams.newTeam')}
                                onClick={() => setShowAddModal(true)}
                                style={{ height: '38px', padding: '0 12px', flexShrink: 0 }}
                            />
                        )}
                        {isLeader && (
                            <Button
                                variant="primary"
                                icon="person_add"
                                label={t('teams.inviteMember')}
                                onClick={() => navigate(`/mainhub/people/invite?church_id=${finalChurchId}`)}
                                style={{ height: '38px', padding: '0 12px', flexShrink: 0 }}
                            />
                        )}
                    </div>
                </div>
                <p className="text-body" style={{ color: '#6B7280', marginBottom: '16px' }}>
                    {churchName ? `Iglesia: ${churchName}` : t('teams.manageAllTeams')}
                </p>
            </header>

            {loading ? (
                <div className="flex-center" style={{ height: '200px' }}>
                    <div className="spinner" />
                </div>
            ) : (isLeader && !user?.can_create_teams) ? (
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
                        </Card>
                    )}
                    {groups.map(group => (
                        <Card key={group.id} style={{ padding: '20px', position: 'relative' }} className="sidebar-item">
                            {hasPermission('team.delete') && (
                                <button
                                    onClick={() => handleDeleteTeam(group.id)}
                                    style={{
                                        position: 'absolute', top: '12px', right: '12px',
                                        background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger-red)',
                                        opacity: 0.6,
                                        zIndex: 10
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                </button>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: '24px' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                        <h3 className="text-card-title" style={{ fontWeight: 600 }}>{group.name}</h3>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                            color: 'var(--color-brand-blue)',
                                            fontSize: '11px',
                                            fontWeight: 700
                                        }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                                            <span>{group.members_count || 0}</span>
                                        </div>
                                    </div>
                                    {group.leader_name && (
                                        <p className="text-body" style={{ color: 'var(--color-brand-blue)', fontSize: '13px', fontWeight: 600 }}>
                                            {t('teams.leaderLabel', { name: group.leader_name })}
                                        </p>
                                    )}
                                    <p className="text-body" style={{ color: 'var(--color-ui-text-soft)', marginTop: '4px', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {group.description || (group.leader_name ? '' : t('teams.noDescription'))}
                                    </p>
                                </div>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    backgroundColor: 'var(--color-ui-surface)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--color-brand-blue)'
                                }}>
                                    <span className="material-symbols-outlined">
                                        {group.is_service_team ? 'diversity_3' : 'group'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                                {hasPermission('team.update') && (
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
                            value={newTeamArea || ''}
                            onChange={(e) => setNewTeamArea(e.target.value ? parseInt(e.target.value) : null)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)',
                                backgroundColor: 'var(--color-ui-bg)', color: 'var(--color-ui-text)', marginBottom: '12px'
                            }}
                        >
                            <option value="">Seleccionar un área (opcional)</option>
                            {areas.map((a: any) => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                        <select
                            value={isNewLeader ? 'new' : (newTeamLeader || '')}
                            onChange={(e) => {
                                if (e.target.value === 'new') {
                                    setIsNewLeader(true);
                                    setNewTeamLeader(null);
                                } else {
                                    setIsNewLeader(false);
                                    setNewTeamLeader(e.target.value ? parseInt(e.target.value) : null);
                                }
                            }}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)',
                                backgroundColor: 'var(--color-ui-bg)', color: 'var(--color-ui-text)', marginBottom: isNewLeader ? '12px' : '20px'
                            }}
                        >
                            <option value="">{t('teams.selectLeader')}</option>
                            <option value="new">➕ Agregar nuevo líder...</option>
                            {allPotentialLeaders.map((m: any) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>

                        {isNewLeader && (
                            <div style={{ padding: '12px', backgroundColor: 'var(--color-ui-surface)', borderRadius: '8px', marginBottom: '20px' }}>
                                <p className="text-body" style={{ fontSize: '12px', color: 'var(--color-brand-blue)', marginBottom: '8px', fontWeight: 600 }}>Detalles del nuevo líder</p>
                                <input
                                    type="text"
                                    placeholder="Nombre y Apellido"
                                    value={newLeaderName}
                                    onChange={(e) => setNewLeaderName(e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)',
                                        backgroundColor: 'var(--color-ui-bg)', color: 'var(--color-ui-text)', marginBottom: '8px', fontSize: '14px'
                                    }}
                                />
                                <input
                                    type="email"
                                    placeholder="Correo electrónico"
                                    value={newLeaderEmail}
                                    onChange={(e) => setNewLeaderEmail(e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)',
                                        backgroundColor: 'var(--color-ui-bg)', color: 'var(--color-ui-text)', fontSize: '14px'
                                    }}
                                />
                            </div>
                        )}
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



