import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { peopleService } from '../../../../services/peopleService';
import { useAuth } from '../../../../hooks/useAuth';

export const MemberApprovals: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const [pendingUsers, setPendingUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // Form states for each user
    const [selections, setSelections] = useState<Record<number, { roleId: number; teamIds: number[]; areaIds: number[] }>>({});

    useEffect(() => {
        if (!hasPermission('users.manage') && !hasPermission('users.approve')) {
            navigate('/');
            return;
        }
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [users, allRoles, allGroups, allAreas] = await Promise.all([
                peopleService.getAll(),
                peopleService.getRoles(),
                peopleService.getGroups(),
                peopleService.getAreas()
            ]);

            const pending = users.filter((u: any) => u.status === 'pending');
            setPendingUsers(pending);
            setRoles(allRoles);
            setGroups(allGroups);
            setAreas(allAreas);

            // Initialize selections
            const initialSelections: Record<number, { roleId: number; teamIds: number[]; areaIds: number[] }> = {};
            pending.forEach(u => {
                initialSelections[u.id] = {
                    roleId: u.role?.id || 5, // Default to Member
                    teamIds: [],
                    areaIds: []
                };
            });
            setSelections(initialSelections);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = (userId: number, roleId: number) => {
        setSelections(prev => ({
            ...prev,
            [userId]: { ...prev[userId], roleId }
        }));
    };

    const toggleTeam = (userId: number, teamId: number) => {
        setSelections(prev => {
            const current = prev[userId].teamIds;
            const next = current.includes(teamId)
                ? current.filter(id => id !== teamId)
                : [...current, teamId];
            return {
                ...prev,
                [userId]: { ...prev[userId], teamIds: next }
            };
        });
    };

    const toggleArea = (userId: number, areaId: number) => {
        setSelections(prev => {
            const current = prev[userId].areaIds;
            const next = current.includes(areaId)
                ? current.filter(id => id !== areaId)
                : [...current, areaId];
            return {
                ...prev,
                [userId]: { ...prev[userId], areaIds: next }
            };
        });
    };

    const handleApprove = async (userId: number) => {
        const sel = selections[userId];
        if (!sel) return;

        if (sel.areaIds.length === 0) {
            alert(t('people.mandatoryArea'));
            return;
        }

        setProcessingId(userId);
        try {
            const success = await peopleService.approveUser(userId, sel.roleId, sel.teamIds, sel.areaIds);
            if (success) {
                setPendingUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                alert(t('people.approvalError'));
            }
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="flex-center" style={{ height: '300px' }}><div className="spinner" /></div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
            <header style={{ marginBottom: '24px' }}>
                <h1 className="text-h1">{t('people.moderation.title')}</h1>
                <p className="text-body-secondary">{t('people.moderation.desc')}</p>
            </header>

            {pendingUsers.length === 0 ? (
                <Card style={{ padding: '40px', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-ui-text-soft)', marginBottom: '16px', opacity: 0.3 }}>group_add</span>
                    <p className="text-body-secondary">{t('people.moderation.empty')}</p>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {pendingUsers.map(u => (
                        <Card key={u.id} style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div>
                                    <h3 className="text-card-title" style={{ fontSize: '18px' }}>{u.name}</h3>
                                    <p className="text-body-secondary" style={{ fontSize: '14px' }}>{u.email}</p>
                                </div>
                                <Button
                                    variant="primary"
                                    label={processingId === u.id ? t('people.approving') : t('people.moderation.approve')}
                                    disabled={processingId !== null}
                                    onClick={() => handleApprove(u.id)}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <label className="text-overline" style={{ display: 'block', marginBottom: '8px' }}>
                                        {t('people.moderation.selectRole')}
                                    </label>
                                    <select
                                        value={selections[u.id]?.roleId}
                                        onChange={e => handleRoleChange(u.id, parseInt(e.target.value))}
                                        className="w-full"
                                    >
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.displayName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-overline" style={{ display: 'block', marginBottom: '8px' }}>
                                        {t('people.moderation.selectTeams')}
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {groups.map(g => (
                                            <button
                                                key={g.id}
                                                onClick={() => toggleTeam(u.id, g.id)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '20px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    border: '1px solid var(--color-border-subtle)',
                                                    backgroundColor: selections[u.id]?.teamIds.includes(g.id)
                                                        ? 'var(--color-brand-blue)'
                                                        : 'var(--color-ui-bg)',
                                                    color: selections[u.id]?.teamIds.includes(g.id)
                                                        ? 'white'
                                                        : 'var(--color-ui-text)'
                                                }}
                                            >
                                                {g.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <label className="text-overline" style={{ display: 'block', marginBottom: '8px' }}>
                                    {t('people.mandatoryAreaLabel')}
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {areas.map((area) => {
                                        const areaId = area.id;
                                        const isSelected = selections[u.id]?.areaIds.includes(areaId);
                                        return (
                                            <button
                                                key={areaId}
                                                onClick={() => toggleArea(u.id, areaId)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '20px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    border: '1px solid var(--color-border-subtle)',
                                                    backgroundColor: isSelected
                                                        ? '#10B981'
                                                        : 'var(--color-ui-bg)',
                                                    color: isSelected
                                                        ? 'white'
                                                        : 'var(--color-ui-text)'
                                                }}
                                            >
                                                {area.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};



