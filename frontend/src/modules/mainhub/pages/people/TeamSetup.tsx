import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { peopleService } from '../../../../services/peopleService';
import { useToast } from '../../../../context/ToastContext';

interface TeamInvite {
    areaId: number;
    teamName: string;
    leaderName: string;
    leaderEmail: string;
}

export const TeamSetup: FC = () => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const churchId = searchParams.get('church_id');
    const [areas, setAreas] = useState<any[]>([]);
    const [teams, setTeams] = useState<TeamInvite[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [loadingAreas, setLoadingAreas] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAreas();
    }, []);

    const loadAreas = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/areas${churchId ? `?church_id=${churchId}` : ''}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setAreas(result.areas);
                if (result.areas.length > 0) {
                    setTeams([{ areaId: result.areas[0].id, teamName: '', leaderName: '', leaderEmail: '' }]);
                }
            }
        } catch (err) {
            setError(t('setup.teams.errorLoadAreas'));
        } finally {
            setLoadingAreas(false);
        }
    };

    const handleAddTeam = () => {
        setTeams([...teams, { areaId: areas[0]?.id, teamName: '', leaderName: '', leaderEmail: '' }]);
    };

    const handleRemoveTeam = (index: number) => {
        setTeams(teams.filter((_, i) => i !== index));
    };

    const handleTeamChange = (index: number, field: keyof TeamInvite, value: any) => {
        const newTeams = [...teams];
        newTeams[index] = { ...newTeams[index], [field]: value };
        setTeams(newTeams);
    };

    const handleFinish = async () => {
        const validTeams = teams.filter(t => t.teamName.trim().length > 0);
        if (validTeams.length === 0) {
            setError(t('setup.teams.errorEmpty'));
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const cId = churchId ? parseInt(churchId) : undefined;
            for (const team of validTeams) {
                // 1. Create Team
                const teamResult = await peopleService.addGroup(team.teamName, null, team.areaId, cId);
                if (!teamResult) throw new Error(t('setup.teams.errorCreate'));

                // 2. Invite Leader if provided (non-blocking)
                if (team.leaderEmail && team.leaderName) {
                    try {
                        const success = await peopleService.invite(team.leaderName, team.leaderEmail, 3, cId);
                        if (!success) {
                            addToast(t('setup.teams.errorInvite') || 'Error al invitar líder', 'warning');
                        }
                    } catch (inviteErr) {
                        console.error('Invitation failed:', inviteErr);
                        addToast(t('setup.teams.errorInvite') || 'Error al invitar líder', 'warning');
                    }
                }
            }
            navigate('/mainhub/churches');
        } catch (err: any) {
            setError(t('setup.areas.errorDelay'));
        } finally {
            setIsSaving(false);
        }
    };

    if (loadingAreas) return <div className="flex-center" style={{ height: '200px' }}><div className="spinner" /></div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
            <header style={{ marginBottom: '24px' }}>
                <h1 className="text-h1">{t('setup.teams.title')}</h1>
                <p className="text-body" style={{ color: 'gray' }}>{t('setup.teams.subtitle')}</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {error && (
                    <div style={{
                        padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
                        borderRadius: '8px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        {error}
                    </div>
                )}

                {teams.map((team, index) => (
                    <Card key={index} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                        {teams.length > 1 && (
                            <button
                                onClick={() => handleRemoveTeam(index)}
                                style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                            </button>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label className="text-overline" style={{ display: 'block', marginBottom: '4px', color: 'gray' }}>{t('setup.teams.areaLabel')}</label>
                                <select
                                    value={team.areaId}
                                    onChange={e => handleTeamChange(index, 'areaId', parseInt(e.target.value))}
                                    style={{
                                        width: '100%', padding: '10px', borderRadius: '10px',
                                        border: '1px solid var(--color-border-subtle)',
                                        backgroundColor: 'var(--color-ui-bg)', color: 'var(--color-ui-text)'
                                    }}
                                >
                                    {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-overline" style={{ display: 'block', marginBottom: '4px', color: 'gray' }}>{t('setup.teams.teamNameLabel')}</label>
                                <input
                                    type="text"
                                    placeholder={t('setup.teams.teamNamePlaceholder')}
                                    value={team.teamName}
                                    onChange={e => handleTeamChange(index, 'teamName', e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px', borderRadius: '10px',
                                        border: '1px solid var(--color-border-subtle)',
                                        backgroundColor: 'var(--color-ui-bg)', color: 'var(--color-ui-text)'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '12px' }}>
                            <p className="text-overline" style={{ color: 'var(--color-brand-blue)', marginBottom: '8px' }}>{t('setup.teams.inviteLeaderTitle')}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <input
                                    type="text"
                                    placeholder={t('setup.teams.leaderNamePlaceholder')}
                                    value={team.leaderName}
                                    onChange={e => handleTeamChange(index, 'leaderName', e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px', borderRadius: '10px',
                                        border: '1px solid var(--color-border-subtle)',
                                        backgroundColor: 'var(--color-ui-bg)', color: 'var(--color-ui-text)'
                                    }}
                                />
                                <input
                                    type="email"
                                    placeholder={t('setup.teams.leaderEmailPlaceholder')}
                                    value={team.leaderEmail}
                                    onChange={e => handleTeamChange(index, 'leaderEmail', e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px', borderRadius: '10px',
                                        border: '1px solid var(--color-border-subtle)',
                                        backgroundColor: 'var(--color-ui-bg)', color: 'var(--color-ui-text)'
                                    }}
                                />
                            </div>
                        </div>
                    </Card>
                ))}

                <Button variant="secondary" icon="add" label={t('setup.teams.addAction')} onClick={handleAddTeam} />

                <div style={{ marginTop: '24px' }}>
                    <Button
                        variant="primary"
                        onClick={handleFinish}
                        disabled={isSaving}
                        style={{ width: '100%', height: '56px', fontSize: '18px' }}
                    >
                        {isSaving ? t('setup.teams.saving') : t('setup.teams.finish')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
