import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useEffect, useState } from 'react';
import { songService } from '../services/songService';
import { peopleService } from '../services/peopleService';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { MasterDashboard } from '../modules/mainhub/pages/MasterDashboard';
import { PastorDashboard } from '../modules/mainhub/pages/PastorDashboard';
import { Playlists } from '../modules/worship/pages/Playlists';
import { Reports } from '../modules/mainhub/pages/Reports';
import { useProfileCompletion } from '../hooks/useProfileCompletion';

export const MainDashboard: FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    useProfileCompletion();
    const [pendingCount, setPendingCount] = useState(0);
    const [pendingMembers, setPendingMembers] = useState(0);
    const [groups, setGroups] = useState<any[]>([]);
    const [requestingId, setRequestingId] = useState<number | null>(null);

    const isGuest = user?.role?.level === 200;
    const isLeader = (user?.role?.level || 100) <= 50;

    const isMaster = user?.role?.name === 'master';
    const isPastor = user?.role?.name === 'pastor';
    const isMember = user?.role?.name === 'member' || (!isPastor && !isMaster && !isLeader && !isGuest);

    useEffect(() => {
        if (isLeader) {
            songService.getPendingEdits().then(edits => setPendingCount(edits.length));
        }
        if (isMaster || isPastor) {
            peopleService.getAll().then(users => {
                const pending = users.filter((u: any) => u.status === 'pending');
                setPendingMembers(pending.length);
            });
        }
        if (isGuest) {
            peopleService.getGroups().then(setGroups);
        }
    }, [user, isLeader, isGuest, isMaster, isPastor]);

    const handleRequestJoin = (groupId: number) => {
        setRequestingId(groupId);
        setTimeout(() => {
            setRequestingId(null);
            alert('Tu solicitud ha sido enviada a los líderes del equipo. Te avisaremos cuando seas aceptado.');
        }, 1000);
    };

    // Role-based HOME selection
    if (isPastor) return <Reports />;
    if (isMember) return <Playlists />;
    if (isMaster) return <MasterDashboard />;

    if (isGuest) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <header>
                    <h1 className="text-h1" style={{ marginBottom: '8px' }}>
                        ¡Bienvenido, {user?.name}!
                    </h1>
                    <Card style={{ backgroundColor: 'var(--color-brand-blue-light)', border: '1px solid var(--color-brand-blue)' }}>
                        <p className="text-body" style={{ color: 'var(--color-brand-blue)', fontWeight: 500 }}>
                            {t('people.moderation.pendingApproval')}
                        </p>
                    </Card>
                </header>

                <section>
                    <h2 className="text-h2" style={{ marginBottom: '16px' }}>Equipos Disponibles</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {groups.length === 0 ? (
                            <p className="text-body" style={{ color: 'gray' }}>Cargando equipos...</p>
                        ) : (
                            groups.map(group => (
                                <Card key={group.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p className="text-card-title">{group.name}</p>
                                        <p className="text-overline" style={{ color: 'gray' }}>{group.description || 'Sin descripción'}</p>
                                    </div>
                                    <Button
                                        label={requestingId === group.id ? 'Solicitando...' : 'Solicitar Unirse'}
                                        variant="secondary"
                                        disabled={requestingId !== null}
                                        onClick={() => handleRequestJoin(group.id)}
                                    />
                                </Card>
                            ))
                        )}
                    </div>
                </section>

                <section>
                    <Card style={{ backgroundColor: 'var(--color-ui-surface)', textAlign: 'center', padding: '24px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'gray', marginBottom: '12px' }}>info</span>
                        <p className="text-body" style={{ color: 'gray', margin: 0 }}>
                            Mientras esperas, puedes personalizar tu <span style={{ color: 'var(--color-brand-blue)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/profile')}>perfil y tema</span>.
                        </p>
                    </Card>
                </section>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {isMaster && <MasterDashboard />}
            {isPastor && <PastorDashboard />}

            {!isMaster && !isPastor && (
                <>
                    <header>
                        <h1 className="text-h1" style={{ marginBottom: '4px' }}>
                            {t('dashboard.welcome', { name: user?.name || '' })}
                        </h1>
                        <p className="text-body" style={{ color: '#6B7280' }}>{t('dashboard.happeningToday')}</p>
                    </header>

                    {isLeader && pendingCount > 0 && (
                        <Card
                            onClick={() => navigate('/songs/approvals')}
                            style={{
                                backgroundColor: 'var(--color-brand-blue-light)',
                                border: '1px solid var(--color-brand-blue)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px',
                                marginBottom: '8px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)', fontSize: '28px' }}>pending_actions</span>
                                <div>
                                    <p className="text-card-title" style={{ color: 'var(--color-brand-blue)', marginBottom: '2px' }}>
                                        {t('songs.dashboard.pendingEdits', { count: pendingCount })}
                                    </p>
                                    <p className="text-overline" style={{ color: 'var(--color-brand-blue)', opacity: 0.8 }}>
                                        {t('songs.moderation.subtitle')}
                                    </p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)' }}>chevron_right</span>
                        </Card>
                    )}

                    {pendingMembers > 0 && (
                        <Card
                            onClick={() => navigate('/people/approvals')}
                            style={{
                                backgroundColor: 'var(--color-brand-blue-light)',
                                border: '1px solid var(--color-brand-blue)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)', fontSize: '28px' }}>person_add</span>
                                <div>
                                    <p className="text-card-title" style={{ color: 'var(--color-brand-blue)', marginBottom: '2px' }}>
                                        {pendingMembers === 1 ? 'Tienes 1 nueva solicitud de ingreso' : `Tienes ${pendingMembers} solicitudes de ingreso`}
                                    </p>
                                    <p className="text-overline" style={{ color: 'var(--color-brand-blue)', opacity: 0.8 }}>
                                        Aprobación de nuevos integrantes
                                    </p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)' }}>chevron_right</span>
                        </Card>
                    )}
                </>
            )}

            {!isMaster && !isPastor && (
                <section>
                    <h3 className="text-h2" style={{ marginBottom: '16px' }}>{t('dashboard.quickActions')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        <Card
                            className="flex-center"
                            onClick={() => navigate('/songs/new')}
                            style={{ flexDirection: 'column', padding: '24px 16px', gap: '8px', cursor: 'pointer' }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-brand-blue)' }}>add_circle</span>
                            <span className="text-card-title">{t('dashboard.newSong')}</span>
                        </Card>
                        <Card
                            className="flex-center"
                            onClick={() => navigate('/people')}
                            style={{ flexDirection: 'column', padding: '24px 16px', gap: '8px', cursor: 'pointer' }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-brand-blue)' }}>person_add</span>
                            <span className="text-card-title">{t('dashboard.addPerson')}</span>
                        </Card>
                    </div>
                </section>
            )}

            {/* Global Activity Feed for everyone (except guests handled above) */}
            <ActivityFeed />
        </div>
    );
};

