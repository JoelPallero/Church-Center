import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { peopleService } from '../../../../services/peopleService';
import { useAuth } from '../../../../hooks/useAuth';
import { useToast } from '../../../../context/ToastContext';
import type { User, UserRoleName } from '../../../../context/AuthContext';
import { EditMemberModal } from '../../../../components/people/EditMemberModal';

export const PeopleList: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const { addToast } = useToast();
    const [searchParams] = useSearchParams();
    const churchId = searchParams.get('church_id') ? parseInt(searchParams.get('church_id')!) : null;
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState<UserRoleName | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active'>('all');

    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    const isPlainMember = user?.role && user.role.level > 30;
    const isMaster = user?.role?.name === 'master';

    useEffect(() => {
        loadUsers();
        if (isMaster) {
            loadRoles();
            loadOrgData();
        }
    }, []); // Only on mount

    useEffect(() => {
        // Add click listener for auto-close
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.card-menu-container') && activeMenu !== null) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeMenu]);

    const loadRoles = async () => {
        // No longer used in this component but moved to modal
    };

    const loadOrgData = async () => {
        // No longer used in this component but moved to modal
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = isPlainMember
                ? await peopleService.getTeam()
                : await peopleService.getAll(churchId || undefined);
            setUsers(data);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async (user: User) => {
        if (!user.email) return;
        const success = await peopleService.resendInvitation(user.email);
        if (success) {
            addToast(t('people.invitationSent') || 'Invitación enviada correctamente', 'success');
        } else {
            addToast(t('people.invitationError') || 'Error al enviar invitación', 'error');
        }
    };



    const handleDelete = async (target: User) => {
        const isInvitation = target.status === 'pending' || target.role?.name === 'guest' || !target.role?.name;

        if (isInvitation) {
            if (!target.email) return;
            if (!window.confirm(t('people.confirmDeleteInvitation', { name: target.name }) || `¿Estás seguro de que deseas eliminar la invitación de ${target.name}?`)) return;
            const success = await peopleService.deleteInvitation(target.email);
            if (success) {
                addToast(t('people.invitationDeleted') || 'Invitación eliminada.', 'success');
                loadUsers();
            } else {
                addToast(t('common.failed') || 'Error al eliminar la invitación.', 'error');
            }
        } else {
            const isAdmin = user?.role?.level && user.role.level <= 10;
            const actionText = isAdmin ? t('common.deletePermanently') || 'ELIMINAR PERMANENTEMENTE' : t('common.deactivate') || 'desactivar';
            const confirmMsg = t('people.confirmDelete', { action: actionText, name: target.name }) || `¿Estás seguro de que deseas ${actionText} el perfil de ${target.name}?${isAdmin ? '\n\nATENCIÓN: Esta acción borrará todos sus datos y no se puede deshacer.' : ''}`;

            if (!window.confirm(confirmMsg)) return;

            const success = isAdmin
                ? await peopleService.deleteMember(target.id)
                : await peopleService.updateStatus(target.id, 2); // 2 = Inactive

            if (success) {
                addToast(isAdmin ? t('people.deletedSuccess') : t('people.deactivatedSuccess'), 'success');
                loadUsers();
            } else {
                addToast(isAdmin ? t('people.deleteError') : t('people.deactivateError'), 'error');
            }
        }
    };

    const getFilteredUsers = () => {
        let list = [...users];

        // 1. Search filter
        if (searchTerm) {
            list = list.filter(u =>
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 2. Role filter
        if (filterRole !== 'all') {
            list = list.filter(u => u.role?.name === filterRole);
        }

        // 3. Status filter
        if (filterStatus !== 'all') {
            list = list.filter((u: any) => u.status === filterStatus);
        }

        // 4. Hide self
        list = list.filter(u => u.id !== user?.id);

        return list;
    };

    const filteredUsers = getFilteredUsers();

    const getStatusText = (item: any) => {
        if (item.status === 'pending') return t('people.status.pending');
        if (item.status === 'active' && item.role_name === 'guest') return t('people.status.accepted');
        return t('people.status.active');
    };




    return (
        <div>
            {editingUser && (
                <EditMemberModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={() => {
                        setEditingUser(null);
                        loadUsers();
                    }}
                />
            )}
            <header style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h1 className="text-h1">{t('people.title')}</h1>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(hasPermission('users.approve') || !isPlainMember) && (
                            <Button
                                variant="secondary"
                                onClick={() => navigate(`/mainhub/people/approvals${churchId ? `?church_id=${churchId}` : ''}`)}
                                icon="how_to_reg"
                                label={t('people.approvals')}
                            />
                        )}
                        {hasPermission('users.invite') && (
                            <Button
                                variant="primary"
                                onClick={() => navigate(`/mainhub/people/invite${churchId ? `?church_id=${churchId}` : ''}`)}
                                icon="person_add"
                                label={t('people.invite')}
                            />
                        )}
                    </div>
                </div>
                <p className="text-body" style={{ color: '#6B7280', marginBottom: '16px' }}>
                    {isPlainMember ? t('people.worshipTeamDesc') : t('people.generalMembersDesc')}
                </p>

                <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <span className="material-symbols-outlined" style={{
                            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'gray'
                        }}>search</span>
                        <input
                            type="text"
                            placeholder={t('people.searchPlaceholder')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
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
                    {!isPlainMember && (
                        <Button
                            variant="secondary"
                            onClick={() => setShowFilters(!showFilters)}
                            style={{ padding: '0 12px' }}
                        >
                            <span className="material-symbols-outlined">filter_list</span>
                        </Button>
                    )}
                </div>

                {
                    showFilters && (
                        <Card style={{ padding: '16px' }}>
                            <label className="text-overline" style={{ color: 'gray', display: 'block', marginBottom: '8px' }}>{t('people.filterByRole')}</label>
                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                                {(['all', 'admin', 'pastor', 'leader', 'coordinator', 'member'] as const).map(role => (
                                    <button
                                        key={role}
                                        onClick={() => setFilterRole(role as any)}
                                        className="text-overline"
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            border: filterRole === role ? 'none' : '1px solid var(--color-border-subtle)',
                                            backgroundColor: filterRole === role ? 'var(--color-brand-blue)' : 'var(--color-ui-bg)',
                                            color: filterRole === role ? 'white' : 'var(--color-ui-text)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {role === 'all' ? t('common.all') : t(`people.roles.${role}`)}
                                    </button>
                                ))}
                            </div>

                            <label className="text-overline" style={{ color: 'gray', display: 'block', marginBottom: '8px', marginTop: '12px' }}>{t('people.filterByStatus')}</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {(['all', 'active', 'pending'] as const).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status as any)}
                                        className="text-overline"
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            border: filterStatus === status ? 'none' : '1px solid var(--color-border-subtle)',
                                            backgroundColor: filterStatus === status ? 'var(--color-brand-blue)' : 'var(--color-ui-bg)',
                                            color: filterStatus === status ? 'white' : 'var(--color-ui-text)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {status === 'all' ? t('common.all') : t(`people.${status}`)}
                                    </button>
                                ))}
                            </div>
                        </Card>
                    )
                }
            </header >

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {loading ? (
                    <div className="flex-center" style={{ height: '200px' }}>
                        <div className="spinner" />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <p className="text-body" style={{ textAlign: 'center', color: 'gray', marginTop: '40px' }}>{t('people.noResults')}</p>
                ) : (
                    filteredUsers.map((item: any) => (
                        <Card
                            key={item.id}
                            style={{ position: 'relative', overflow: 'visible', padding: '16px', cursor: 'pointer' }}
                            onClick={() => setEditingUser(item)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {/* Left Side: Avatar and Info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '16px',
                                        backgroundColor: (item.role_name === 'guest' || !item.role_name) ? '#6B7280' : (
                                            item.role_name === 'pastor' || item.role_name === 'admin' ? '#9333EA' :
                                                item.role_name === 'leader' ? '#2563EB' :
                                                    item.role_name === 'coordinator' ? '#0D9488' :
                                                        '#16A34A'
                                        ),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', color: 'white',
                                        fontSize: '20px',
                                        overflow: 'hidden',
                                        // Specific styling for guests/no-role to show initial only
                                        ...((item.role_name === 'guest' || !item.role_name) && { backgroundColor: '#475569' })
                                    }}>
                                        {((item.role_name === 'guest' || !item.role_name)) ? (
                                            item.name.charAt(0)
                                        ) : (
                                            <img
                                                src={item.sex === 'F' ? '/avatars/female.png' : '/avatars/male.png'}
                                                alt="avatar"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).parentElement!.innerText = item.name.charAt(0);
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-card-title" style={{ color: 'white' }}>{item.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                            <p className="text-body" style={{ color: '#94A3B8', fontSize: '13px' }}>
                                                {item.role?.displayName || t('people.roles.member')}
                                            </p>
                                            {isMaster && (item as any).church_name && (
                                                <>
                                                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#475569' }}></span>
                                                    <p className="text-body" style={{ color: 'var(--color-brand-blue)', fontSize: '13px', fontWeight: 600 }}>
                                                        {(item as any).church_name}
                                                    </p>
                                                </>
                                            )}
                                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#475569' }}></span>
                                            <div style={{
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                color: item.status === 'active' ? '#10B981' : item.status === 'pending' ? '#F59E0B' : '#EF4444',
                                                textTransform: 'uppercase'
                                            }}>
                                                {getStatusText(item)}
                                            </div>
                                            {item.areas && item.areas.length > 0 && (
                                                <>
                                                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#475569' }}></span>
                                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                        {item.areas.map((a: any) => (
                                                            <span key={a.id} style={{ fontSize: '9px', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                {a.name.toUpperCase()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: 3-dot Menu */}
                                <div style={{ position: 'relative' }} className="card-menu-container" onClick={e => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === item.id ? null : item.id); }}
                                        style={{ padding: '8px', minWidth: 'auto', color: '#94A3B8', background: 'none', border: 'none' }}
                                    >
                                        <span className="material-symbols-outlined">more_vert</span>
                                    </Button>

                                    {activeMenu === item.id && (
                                        <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', right: 0, width: '220px', zIndex: 9999 }}>
                                            {item.status === 'pending' ? (
                                                <>
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); handleResend(item); setActiveMenu(null); }}
                                                        className="dropdown-item"
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                                                        {t('people.resendInvitation')}
                                                    </div>
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(item); setActiveMenu(null); }}
                                                        className="dropdown-item"
                                                        style={{ color: '#EF4444' }}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                                        {t('common.delete')}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); setEditingUser(item); setActiveMenu(null); }}
                                                        className="dropdown-item"
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                                        {t('common.edit')}
                                                    </div>
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(item); setActiveMenu(null); }}
                                                        className="dropdown-item"
                                                        style={{ color: '#EF4444' }}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                                        {t('common.delete')}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div >
    );
};



