import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { peopleService } from '../../services/peopleService';
import { useAuth } from '../../hooks/useAuth';

interface TeamSettingsProps {
    team: any;
    onClose: () => void;
    onSaved: () => void;
}

const TeamSettingsModal: FC<TeamSettingsProps> = ({ team, onClose, onSaved }) => {
    const [allMembers, setAllMembers] = useState<any[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [members] = await Promise.all([
                peopleService.getAll()
            ]);
            setAllMembers(members);

            // Fetch current members of this specific team if possible, 
            // but for mass assignment we usually just pick who belongs now.
            // Let's assume we want to see who is currently in the team.
            // We'll need a way to get team members.
            const teamMembers = await peopleService.getTeamMembers(team.id);
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
        const success = await peopleService.assignTeamBulk(team.id, selectedMembers);
        setSaving(false);
        if (success) {
            onSaved();
        } else {
            alert('Error al guardar asignaciones.');
        }
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <Card style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
                <h2 className="text-h2" style={{ marginBottom: '8px' }}>Configurar Equipo: {team.name}</h2>
                <p className="text-body" style={{ color: 'gray', marginBottom: '20px' }}>Selecciona los miembros que pertenecen a este equipo.</p>

                {loading ? (
                    <div className="flex-center" style={{ flex: 1 }}><div className="spinner" /></div>
                ) : (
                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px', padding: '4px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                            {allMembers.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => toggleMember(m.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '12px',
                                        border: '1px solid var(--color-border-subtle)', cursor: 'pointer',
                                        backgroundColor: selectedMembers.includes(m.id) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                        borderColor: selectedMembers.includes(m.id) ? 'var(--color-brand-blue)' : 'var(--color-border-subtle)',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '12px', height: '12px', borderRadius: '50%',
                                        border: '2px solid var(--color-brand-blue)',
                                        backgroundColor: selectedMembers.includes(m.id) ? 'var(--color-brand-blue)' : 'transparent'
                                    }} />
                                    <span className="text-body" style={{ fontSize: '14px', fontWeight: selectedMembers.includes(m.id) ? 600 : 400 }}>{m.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <Button variant="ghost" label="Cancelar" onClick={onClose} disabled={saving} />
                    <Button variant="primary" label={saving ? "Guardando..." : "Guardar Asignaciones"} onClick={handleSave} disabled={saving || loading} />
                </div>
            </Card>
        </div>
    );
};

export const TeamsList: FC = () => {
    const { t } = useTranslation();
    const { user, hasPermission } = useAuth();
    const [groups, setGroups] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [configTeam, setConfigTeam] = useState<any>(null);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamLeader, setNewTeamLeader] = useState<number | null>(null);
    const [allPotentialLeaders, setAllPotentialLeaders] = useState<any[]>([]);
    const navigate = useNavigate();

    const isLeader = user?.role?.name === 'leader' || user?.role?.name === 'coordinator';
    const isAdmin = user?.role?.name === 'pastor' || user?.role?.name === 'master';

    useEffect(() => {
        if (isAdmin) {
            loadGroups();
            loadPotentialLeaders();
        } else if (isLeader) {
            loadMyTeam();
        }
    }, [isAdmin, isLeader]);

    const loadPotentialLeaders = async () => {
        const data = await peopleService.getAll();
        setAllPotentialLeaders(data);
    };

    const loadGroups = async () => {
        try {
            setLoading(true);
            const data = await peopleService.getGroups();
            setGroups(data);
        } finally {
            setLoading(false);
        }
    };

    const loadMyTeam = async () => {
        try {
            setLoading(true);
            const data = await peopleService.getMyTeamMembers();
            setMembers(data);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTeam = async () => {
        if (!newTeamName.trim()) return;
        const success = await peopleService.addGroup(newTeamName, newTeamLeader);
        if (success) {
            setShowAddModal(false);
            setNewTeamName('');
            setNewTeamLeader(null);
            loadGroups();
        } else {
            alert('Error al crear equipo.');
        }
    };

    const handleDeleteTeam = async (id: number) => {
        if (!window.confirm('¿Estás seguro de eliminar este equipo?')) return;
        const success = await peopleService.deleteGroup(id);
        if (success) {
            loadGroups();
        } else {
            alert('Error al eliminar equipo.');
        }
    };

    return (
        <div>
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="text-h1">{isLeader ? 'Mi Equipo' : t('nav.teams')}</h1>
                    <p className="text-body" style={{ color: 'gray' }}>
                        {isLeader ? 'Gestiona a los integrantes de tu equipo.' : 'Gestiona los ministerios y equipos de servicio.'}
                    </p>
                </div>
                {hasPermission('teams.create') && isAdmin && (
                    <Button
                        variant="primary"
                        icon="add"
                        label="Nuevo Equipo"
                        onClick={() => setShowAddModal(true)}
                    />
                )}
                {isLeader && (
                    <Button
                        variant="primary"
                        icon="person_add"
                        label="Invitar Miembro"
                        onClick={() => navigate('/people/invite')}
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
                        <p className="text-body" style={{ textAlign: 'center', color: 'gray', marginTop: '40px' }}>No hay integrantes en tu equipo todavía.</p>
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
                                                    {item.role?.display || 'Miembro'}
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
                                            Líder: {group.leader_name}
                                        </p>
                                    )}
                                    <p className="text-body" style={{ color: 'gray', marginTop: group.leader_name ? '4px' : '8px', fontSize: '14px' }}>
                                        {group.description || (group.leader_name ? '' : 'Sin descripción')}
                                    </p>
                                </div>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)' }}>
                                    {group.is_service_team ? 'diversity_3' : 'group'}
                                </span>
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                                {hasPermission('teams.edit') && (
                                    <Button variant="secondary" onClick={() => setConfigTeam(group)} style={{ flex: 1, fontSize: '12px', padding: '8px' }}>
                                        Configurar
                                    </Button>
                                )}
                                <Button variant="ghost" style={{ flex: 1, fontSize: '12px', padding: '8px' }}>
                                    Ver Miembros
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
                        <h2 className="text-h2" style={{ marginBottom: '16px' }}>Crear Nuevo Equipo</h2>
                        <input
                            type="text"
                            placeholder="Nombre del equipo (ej. Sonido)"
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
                            <option value="">Seleccionar Líder / Coordinador</option>
                            {allPotentialLeaders.map((m: any) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <Button variant="ghost" label="Cancelar" onClick={() => setShowAddModal(false)} />
                            <Button variant="primary" label="Crear" onClick={handleAddTeam} />
                        </div>
                    </Card>
                </div>
            )}

            {configTeam && (
                <TeamSettingsModal
                    team={configTeam}
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
