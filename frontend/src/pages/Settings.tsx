import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { AuthService } from '../services/authService';
import { Card } from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

export const Settings: FC = () => {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { hasRole } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    const isMaster = user?.role?.name === 'master';
    const canCustomizeInvitations = isMaster || hasRole('pastor') || hasRole('leader') || hasRole('coordinator');

    const handleLanguageChange = async (lang: string) => {
        setIsSaving(true);
        try {
            await i18n.changeLanguage(lang);
            if (user) {
                await AuthService.updateSettings(theme, lang);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleThemeChange = async (newTheme: 'light' | 'dark') => {
        setIsSaving(true);
        try {
            setTheme(newTheme);
            if (user) {
                await AuthService.updateSettings(newTheme, i18n.language);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const SettingRow = ({ icon, title, subtitle, onClick, color = 'var(--color-brand-blue)', rightElement }: any) => (
        <Card
            onClick={onClick}
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: onClick ? 'pointer' : 'default',
                padding: '16px',
                marginBottom: '8px',
                opacity: isSaving ? 0.7 : 1,
                pointerEvents: isSaving ? 'none' : 'auto'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    backgroundColor: `${color}10`,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
                <div>
                    <p className="text-body" style={{ fontWeight: 600, margin: 0 }}>{title}</p>
                    {subtitle && <p className="text-overline" style={{ marginTop: '2px' }}>{subtitle}</p>}
                </div>
            </div>
            {rightElement ? rightElement : (onClick && <span className="material-symbols-outlined" style={{ color: 'var(--color-ui-text-soft)', opacity: 0.5 }}>chevron_right</span>)}
        </Card>
    );

    return (
        <div style={{ paddingBottom: '40px' }}>
            <header style={{ marginBottom: '24px' }}>
                <h1 className="text-h1">{t('profile.preferences')}</h1>
                <p className="text-body-secondary">{t('dashboard.personalizeExperience') || 'Personaliza tu experiencia en la plataforma.'}</p>
            </header>

            <div className="settings-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '32px'
            }}>
                {/* Column 1: Personal & System */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Account Section */}
                    <section>
                        <h3 className="text-overline" style={{ color: 'var(--color-brand-blue)', marginBottom: '16px', letterSpacing: '1px', fontWeight: 700 }}>{t('profile.account')}</h3>
                        <SettingRow
                            icon="person"
                            title={t('nav.me') || t('profile.title')}
                            subtitle={t('profile.accountSubtitle')}
                            onClick={() => navigate('/profile')}
                        />
                    </section>

                    {/* System Section */}
                    <section>
                        <h3 className="text-overline" style={{ color: 'var(--color-brand-blue)', marginBottom: '16px', letterSpacing: '1px', fontWeight: 700 }}>{t('profile.system')}</h3>
                        <SettingRow
                            icon="palette"
                            title={t('profile.theme')}
                            subtitle={theme === 'dark' ? t('profile.dark') : t('profile.light')}
                            rightElement={
                                <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--color-ui-bg)', padding: '4px', borderRadius: '12px' }}>
                                    <div
                                        onClick={() => handleThemeChange('light')}
                                        style={{
                                            padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                                            backgroundColor: theme === 'light' ? 'var(--color-brand-blue)' : 'transparent',
                                            color: theme === 'light' ? 'white' : 'var(--color-ui-text-soft)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>light_mode</span>
                                    </div>
                                    <div
                                        onClick={() => handleThemeChange('dark')}
                                        style={{
                                            padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                                            backgroundColor: theme === 'dark' ? 'var(--color-brand-blue)' : 'transparent',
                                            color: theme === 'dark' ? 'white' : 'var(--color-ui-text-soft)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dark_mode</span>
                                    </div>
                                </div>
                            }
                        />

                        <SettingRow
                            icon="translate"
                            title={t('profile.language')}
                            subtitle={t('profile.languageSubtitle')}
                            rightElement={
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {['es', 'en', 'pt'].map(lang => (
                                        <div
                                            key={lang}
                                            onClick={() => handleLanguageChange(lang)}
                                            style={{
                                                width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px',
                                                backgroundColor: i18n.language.startsWith(lang) ? 'var(--color-brand-blue)' : 'var(--color-ui-bg)',
                                                color: i18n.language.startsWith(lang) ? 'white' : 'var(--color-ui-text-soft)',
                                                border: '1px solid var(--color-border-subtle)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {lang.toUpperCase()}
                                        </div>
                                    ))}
                                </div>
                            }
                        />

                        <SettingRow
                            icon="notifications_active"
                            title={t('profile.notifications')}
                            subtitle={t('profile.notificationsSubtitle')}
                            onClick={() => addToast('Próximamente: Configuración de notificaciones push y email.', 'info')}
                        />
                    </section>
                </div>

                {/* Column 2: Management & Help */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Church Administration Section */}
                    {canCustomizeInvitations && (
                        <section>
                            <h3 className="text-overline" style={{ color: 'var(--color-brand-blue)', marginBottom: '16px', letterSpacing: '1px', fontWeight: 700 }}>Gestión de Organización</h3>
                            <SettingRow
                                icon="mail_outline"
                                title="Personalización de Invitaciones"
                                subtitle="Configura los textos y plantillas de los correos"
                                onClick={() => navigate('/settings/invitations')}
                            />
                        </section>
                    )}

                    {/* Admin Section */}
                    {isMaster && (
                        <section>
                            <h3 className="text-overline" style={{ color: 'var(--color-danger-red)', marginBottom: '16px', letterSpacing: '1px', fontWeight: 700 }}>{t('profile.admin')}</h3>
                            <SettingRow
                                icon="security"
                                title={t('profile.adminPermissions')}
                                subtitle={t('profile.adminPermissionsSubtitle')}
                                color="var(--color-danger-red)"
                                onClick={() => navigate('/admin/permissions')}
                            />
                            <SettingRow
                                icon="terminal"
                                title={t('profile.adminDebug')}
                                subtitle={t('profile.adminDebugSubtitle')}
                                color="var(--color-danger-red)"
                                onClick={() => navigate('/debug')}
                            />
                        </section>
                    )}

                    {/* Help Section */}
                    <section>
                        <h3 className="text-overline" style={{ color: 'var(--color-brand-blue)', marginBottom: '16px', letterSpacing: '1px', fontWeight: 700 }}>{t('profile.help')}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px' }}>
                            <Card
                                onClick={() => navigate('/privacy')}
                                style={{ padding: '20px', textAlign: 'center', cursor: 'pointer' }}
                                className="sidebar-item"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-brand-blue)', marginBottom: '12px' }}>menu_book</span>
                                <p className="text-body" style={{ fontWeight: 600 }}>Documentación</p>
                            </Card>
                            <Card
                                onClick={() => navigate('/privacy')}
                                style={{ padding: '20px', textAlign: 'center', cursor: 'pointer' }}
                                className="sidebar-item"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-brand-blue)', marginBottom: '12px' }}>support_agent</span>
                                <p className="text-body" style={{ fontWeight: 600 }}>Soporte técnico</p>
                            </Card>
                        </div>
                    </section>

                    <section style={{ textAlign: 'center', marginTop: '16px', opacity: 0.5 }}>
                        <p className="text-overline" style={{ fontSize: '10px' }}>Church Center v2.0.0-alpha</p>
                    </section>
                </div>
            </div>

        </div>
    );
};
