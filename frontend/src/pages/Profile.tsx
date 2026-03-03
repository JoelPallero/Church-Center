import { useState, useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { InstrumentForm } from '../components/people/InstrumentForm';



import { useNavigate } from 'react-router-dom';
import { EditMemberModal } from '../components/people/EditMemberModal';
import { ServerStatus } from '../components/admin/ServerStatus';

export const Profile: FC = () => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [selectedInstruments, setSelectedInstruments] = useState<number[]>([]);
    const [isEditingInstruments, setIsEditingInstruments] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    useEffect(() => {
        if (user?.instruments) {
            setSelectedInstruments(user.instruments.map(i => i.id));
        }
    }, [user]);

    if (!user) return null;

    return (
        <div>
            {user.role?.name === 'master' && <ServerStatus />}
            {isEditingProfile && (
                <EditMemberModal
                    user={user}
                    onClose={() => setIsEditingProfile(false)}
                    onSave={() => {
                        setIsEditingProfile(false);
                        window.location.reload(); // Refresh to get updated data in context
                    }}
                />
            )}
            <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="text-h1">{t('profile.title')}</h1>
                    <p className="text-body-secondary">Gestiona tu información personal y preferencias.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button
                        variant="secondary"
                        icon="edit"
                        label={t('profile.edit_data')}
                        onClick={() => setIsEditingProfile(true)}
                    />
                    <Button variant="danger" label={t('profile.logout')} onClick={logout} />
                </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* User Info Card */}
                <Card style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '32px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid var(--color-border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px',
                            fontWeight: 'bold',
                            overflow: 'hidden'
                        }}>
                            <img
                                src={user.sex === 'F' ? '/avatars/female.png' : '/avatars/male.png'}
                                alt="avatar"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerText = user.name.charAt(0);
                                }}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <h2 className="text-h1" style={{ fontSize: '32px' }}>{user.name}</h2>
                                <span style={{
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    color: 'var(--color-brand-blue)',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase'
                                }}>
                                    {user.role?.displayName || user.role?.name || t('people.roles.member')}
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ui-text-soft)' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mail</span>
                                    <span className="text-body">{user.email}</span>
                                </div>
                                {user.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ui-text-soft)' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>phone</span>
                                        <span className="text-body">{user.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="profile-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                    {/* Areas & Teams Section */}
                    <section>
                        <h3 className="text-overline" style={{ color: 'var(--color-brand-blue)', marginBottom: '16px', letterSpacing: '1px', fontWeight: 700 }}>{t('profile.areas_teams')}</h3>
                        <Card style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <label className="text-overline" style={{ color: 'var(--color-ui-text-soft)', display: 'block', marginBottom: '12px' }}>{t('profile.assigned_areas')}</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {user.areas && user.areas.length > 0 ? (
                                        user.areas.map((a: any) => (
                                            <span key={a.id} style={{ padding: '6px 14px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                {a.name}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-body" style={{ color: 'gray', fontSize: '13px' }}>{t('profile.no_areas')}</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-overline" style={{ color: 'var(--color-ui-text-soft)', display: 'block', marginBottom: '12px' }}>{t('profile.assigned_groups')}</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {user.groups && user.groups.length > 0 ? (
                                        user.groups.map((g: any) => (
                                            <span key={g.id} style={{ padding: '6px 14px', borderRadius: '12px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#3B82F6', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                                                {g.name}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-body" style={{ color: 'gray', fontSize: '13px' }}>{t('profile.no_teams')}</p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </section>

                    {/* Instrument Selection Section */}
                    <section>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 className="text-overline" style={{ color: 'var(--color-brand-blue)', margin: 0, letterSpacing: '1px', fontWeight: 700 }}>Habilidades / Instrumentos</h3>
                            {!isEditingInstruments && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsEditingInstruments(true)}
                                    style={{ padding: '4px 12px', fontSize: '12px' }}
                                    icon="edit"
                                    label={t('profile.edit')}
                                />
                            )}
                        </div>
                        {isEditingInstruments ? (
                            <InstrumentForm
                                initialSelected={selectedInstruments}
                                onComplete={() => {
                                    setIsEditingInstruments(false);
                                    window.location.reload();
                                }}
                            />
                        ) : (
                            <Card style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                    {user.instruments && user.instruments.length > 0 ? (
                                        user.instruments.map(inst => (
                                            <div
                                                key={inst.id}
                                                style={{
                                                    padding: '12px 20px',
                                                    borderRadius: '16px',
                                                    backgroundColor: 'var(--color-ui-surface)',
                                                    border: '1px solid var(--color-border-subtle)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px'
                                                }}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-brand-blue)' }}>music_note</span>
                                                <span style={{ fontWeight: 600, fontSize: '14px' }}>{inst.name}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-body" style={{ color: 'gray', fontSize: '13px' }}>{t('profile.no_instruments')}</p>
                                    )}
                                </div>
                            </Card>
                        )}
                    </section>
                </div>

                {/* Settings Quick Access Section */}
                <section>
                    <h3 className="text-overline" style={{ color: 'var(--color-brand-blue)', marginBottom: '16px', letterSpacing: '1px', fontWeight: 700 }}>{t('profile.settings')}</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        <Card
                            onClick={() => navigate('/settings')}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '20px' }}
                            className="sidebar-item"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand-blue)' }}>
                                    <span className="material-symbols-outlined">settings</span>
                                </div>
                                <div>
                                    <p className="text-body" style={{ fontWeight: 600, margin: 0 }}>{t('profile.preferences')}</p>
                                    <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>{t('profile.language')} & {t('profile.theme')}</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-ui-text-soft)' }}>chevron_right</span>
                        </Card>

                        <Card
                            onClick={() => navigate('/privacy')}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '20px' }}
                            className="sidebar-item"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-brand-blue)' }}>
                                    <span className="material-symbols-outlined">shield</span>
                                </div>
                                <div>
                                    <p className="text-body" style={{ fontWeight: 600, margin: 0 }}>Privacidad y Soporte</p>
                                    <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>{t('profile.tech_support')}</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-ui-text-soft)' }}>chevron_right</span>
                        </Card>
                    </div>
                </section>
            </div>
        </div>

    );
};
