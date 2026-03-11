import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../hooks/useAuth';
import { peopleService } from '../../../../services/peopleService';
import { PeopleTable } from '../../../../components/people/PeopleTable';
import { EditMemberModal } from '../../../../components/people/EditMemberModal';
import { Card } from '../../../../components/ui/Card';
import { useToast } from '../../../../context/ToastContext';
import type { User } from '../../../../context/AuthContext';

export const MyTeamList: FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<any>(null);
    const [activeMenu, setActiveMenu] = useState<number | null>(null);
    const [noTeam, setNoTeam] = useState(false);

    useEffect(() => {
        loadTeamMembers();
    }, []);

    const loadTeamMembers = async () => {
        try {
            setLoading(true);
            const data = await peopleService.getMyTeamMembers(user?.churchId || undefined);
            setUsers(data);
            setNoTeam(data.length === 0);
        } catch (error) {
            console.error('Error loading team members:', error);
            addToast('Error al cargar integrantes del equipo', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async (u: User) => {
        if (!u.email) return;
        const success = await peopleService.resendInvitation(u.email);
        if (success) addToast(t('people.invitationSent'), 'success');
    };

    const handleDelete = async (target: User) => {
        if (!window.confirm(t('people.confirmDelete', { action: t('common.deactivate'), name: target.name }))) return;
        const success = await peopleService.updateStatus(target.id, 2);
        if (success) {
            addToast(t('people.deactivatedSuccess'), 'success');
            loadTeamMembers();
        }
    };

    const filteredUsers = users.filter(u => 
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         u.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        u.id !== user?.id
    );

    const getStatusText = (item: any) => {
        if (item.status === 'pending') return t('people.status.pending');
        return t('people.status.active');
    };

    if (!loading && noTeam && users.length === 0) {
        return (
            <div className="animate-fadeIn" style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center' }}>
                <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                    color: 'var(--color-brand-blue)', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 24px' 
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>groups</span>
                </div>
                <h2 className="text-h2" style={{ marginBottom: '12px' }}>{t('teams.noTeamAssigned') || 'Sin equipo asignado'}</h2>
                <p className="text-body-secondary" style={{ marginBottom: '24px' }}>
                    {t('teams.noTeamMessage') || 'Aún no has sido asignado como líder de ningún equipo. Comunícate con tu coordinador o pastor para ser asignado a un equipo y poder gestionar a sus integrantes.'}
                </p>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {editingUser && (
                <EditMemberModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={() => {
                        setEditingUser(null);
                        loadTeamMembers();
                    }}
                />
            )}
            
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 className="text-h1">{t('teams.myTeam')}</h1>
                    <p className="text-body" style={{ color: 'var(--color-ui-text-soft)', marginBottom: '0' }}>
                        {t('teams.manageMyTeam')}
                    </p>
                </div>

                <div style={{ position: 'relative', width: '300px' }}>
                    <span className="material-symbols-outlined" style={{
                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'gray', fontSize: '20px'
                    }}>search</span>
                    <input
                        type="text"
                        placeholder={t('people.searchPlaceholder')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="styled-input"
                        style={{ width: '100%', paddingLeft: '40px', borderRadius: '12px', height: '44px' }}
                    />
                </div>
            </header>

            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {loading ? (
                    <div className="flex-center" style={{ height: '200px' }}><div className="spinner" /></div>
                ) : filteredUsers.length === 0 ? (
                    <p className="text-body" style={{ textAlign: 'center', color: 'gray' }}>{t('people.noResults')}</p>
                ) : (
                    filteredUsers.map((item: any) => (
                        <Card 
                            key={item.id} 
                            style={{ padding: '16px', position: 'relative' }}
                            onClick={() => setEditingUser(item)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ 
                                    width: '40px', height: '40px', borderRadius: '12px', 
                                    backgroundColor: 'var(--color-brand-blue)', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                }}>
                                    {item.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 className="text-card-title">{item.name}</h3>
                                    <p className="text-body" style={{ fontSize: '12px', color: 'var(--color-ui-text-soft)' }}>
                                        {item.role?.displayName || t('people.roles.member')}
                                    </p>
                                </div>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: item.status === 'active' ? '#10B981' : '#F59E0B', textTransform: 'uppercase' }}>
                                    {getStatusText(item)}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <div className="desktop-only">
                {loading ? (
                    <div className="flex-center" style={{ height: '200px' }}><div className="spinner" /></div>
                ) : (
                    <Card style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--color-border-subtle)' }}>
                        <PeopleTable
                            users={filteredUsers}
                            onEdit={setEditingUser}
                            onDelete={handleDelete}
                            onResend={handleResend}
                            activeMenu={activeMenu}
                            setActiveMenu={setActiveMenu}
                            getStatusText={getStatusText}
                        />
                    </Card>
                )}
            </div>
        </div>
    );
};
