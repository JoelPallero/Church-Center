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
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="text-h1">{t('profile.title')}</h1>
                <Button
                    variant="secondary"
                    icon="edit"
                    label={t('profile.edit_data')}
                    onClick={() => setIsEditingProfile(true)}
                />
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* User Info Card */}
                <Card style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '24px',
                            backgroundColor: 'var(--color-brand-blue)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '32px',
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
                        <div style={{ flex: 1 }}>
                            <h2 className="text-h2" style={{ marginBottom: '4px' }}>{user.name}</h2>
                            <p className="text-body" style={{ color: '#94A3B8', marginBottom: '8px' }}>{user.email}</p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <span className="text-overline" style={{
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    color: 'var(--color-brand-blue)',
                                    fontWeight: 'bold',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    {(user.role?.displayName || user.role?.name || t('people.roles.member')).toUpperCase()}
                                </span>
                                {user.phone && (
                                    <span className="text-overline" style={{ backgroundColor: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '8px', color: '#94A3B8' }}>
                                        {user.phone}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Areas & Teams Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    <section>
                        <h3 className="text-h2" style={{ marginBottom: '16px' }}>{t('profile.areas_teams')}</h3>
                        <Card style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label className="text-overline" style={{ color: '#64748B', display: 'block', marginBottom: '10px' }}>{t('profile.assigned_areas')}</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {user.areas && user.areas.length > 0 ? (
                                        user.areas.map((a: any) => (
                                            <span key={a.id} style={{ padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                {a.name}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-body" style={{ color: 'gray', fontSize: '13px' }}>{t('profile.no_areas')}</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-overline" style={{ color: '#64748B', display: 'block', marginBottom: '10px' }}>{t('profile.assigned_groups')}</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {user.groups && user.groups.length > 0 ? (
                                        user.groups.map((g: any) => (
                                            <span key={g.id} style={{ padding: '6px 14px', borderRadius: '20px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#3B82F6', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(37, 99, 235, 0.2)' }}>
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
                            <h3 className="text-h2" style={{ margin: 0 }}>{t('profile.instruments_title')}</h3>
                            {!isEditingInstruments && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsEditingInstruments(true)}
                                    style={{ padding: '4px 12px', fontSize: '12px', color: 'var(--color-brand-blue)' }}
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
                            <Card style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {user.instruments && user.instruments.length > 0 ? (
                                        user.instruments.map(inst => (
                                            <span
                                                key={inst.id}
                                                style={{
                                                    padding: '6px 14px',
                                                    borderRadius: '20px',
                                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                                    color: 'white',
                                                    fontSize: '12px',
                                                    border: '1px solid rgba(255,255,255,0.05)'
                                                }}
                                            >
                                                {inst.name}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-body" style={{ color: 'gray', fontSize: '13px' }}>{t('profile.no_instruments')}</p>
                                    )}
                                </div>
                            </Card>
                        )}
                    </section>
                </div>

                {/* Settings Section */}
                <section>
                    <h3 className="text-h2" style={{ marginBottom: '16px' }}>{t('profile.settings')}</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                        <Card
                            onClick={() => navigate('/settings')}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '16px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)' }}>settings</span>
                                <div>
                                    <p className="text-body" style={{ fontWeight: 600, margin: 0 }}>{t('profile.preferences')}</p>
                                    <p className="text-overline" style={{ color: 'gray' }}>{t('profile.language')} & {t('profile.theme')}</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined" style={{ color: 'gray' }}>chevron_right</span>
                        </Card>

                        <Card
                            onClick={() => navigate('/privacy')}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '16px' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)' }}>shield</span>
                                <div>
                                    <p className="text-body" style={{ fontWeight: 600, margin: 0 }}>{t('nav.privacy' in t ? t('nav.privacy') : 'Privacidad')}</p>
                                    <p className="text-overline" style={{ color: 'gray' }}>{t('profile.tech_support')}</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined" style={{ color: 'gray' }}>chevron_right</span>
                        </Card>
                    </div>
                </section>

                <div style={{ marginTop: '20px' }}>
                    <Button variant="danger" label={t('profile.logout')} onClick={logout} style={{ width: '100%' }} />
                </div>
            </div>
        </div>
    );
};
