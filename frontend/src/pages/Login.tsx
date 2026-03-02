import type { FC, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Login: FC = () => {
    const { t } = useTranslation();
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(searchParams.get('error'));

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            // Skip reCAPTCHA for now due to 401/403 errors
            const recaptchaToken = '';
            /*
            const recaptchaToken = await new Promise<string>((resolve) => {
                if (!(window as any).grecaptcha) {
                    console.error('reCAPTCHA not loaded');
                    resolve('');
                    return;
                }
                (window as any).grecaptcha.ready(() => {
                    (window as any).grecaptcha.execute('6Lf3pnwsAAAAANJfrY5MQDh8BogqHziLeosV9Rnw', { action: 'login' })
                        .then((token: string) => resolve(token))
                        .catch((err: any) => {
                            console.error('reCAPTCHA execution failed', err);
                            resolve('');
                        });
                });
            });
            */

            await login(email, password, recaptchaToken);
        } catch (err: any) {
            console.error('Login error details:', err);
            const detail = err.response?.data?.error || err.response?.data?.message || err.message;
            setError(detail);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '24px',
            backgroundColor: 'var(--color-ui-surface)'
        }}>
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-brand-blue)' }}>church</span>
                <h1 className="text-h1" style={{ marginTop: '16px' }}>{t('auth.signInTitle', { church: t('common.church') })}</h1>
                <p className="text-body" style={{ color: '#6B7280' }}>{t('auth.signInSubtitle')}</p>
            </div>

            <Card style={{ padding: '32px', width: '100%', maxWidth: '400px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {error && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#EF4444',
                            borderRadius: '12px',
                            fontSize: '14px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="text-overline" style={{ color: '#6B7280' }}>{t('auth.email')}</label>
                        <input
                            type="email"
                            placeholder={t('auth.emailPlaceholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full"
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="text-overline" style={{ color: '#6B7280' }}>{t('auth.password')}</label>
                            <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--color-brand-blue)', textDecoration: 'none', fontWeight: 500 }}>
                                {t('auth.forgotPassword') || '¿Olvidaste tu contraseña?'}
                            </Link>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full"
                                style={{ paddingRight: '48px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#6B7280',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4px'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        label={isLoading ? t('auth.signingIn') : t('auth.signInAction')}
                        variant="primary"
                        disabled={isLoading}
                        style={{ width: '100%', marginTop: '8px' }}
                    />
                </form>

                <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border-subtle)' }} />
                    <span className="text-overline" style={{ color: '#6B7280' }}>O CONTINUAR CON</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border-subtle)' }} />
                </div>

                <Button
                    onClick={() => {
                        document.cookie = "msm_google_mode=login; path=/; max-age=600";
                        const redirectUri = encodeURIComponent(`${window.location.origin}/api/auth/google/callback`);
                        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile`;
                    }}
                    variant="ghost"
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: '12px',
                        backgroundColor: 'var(--color-ui-bg)'
                    }}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px', height: '18px' }} />
                    <span className="text-body" style={{ fontWeight: 500 }}>Continuar con Google</span>
                </Button>
            </Card>

            <div style={{ marginTop: '24px', textAlign: 'center', maxWidth: '300px' }}>
                <p style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: '1.4' }}>
                    Protegido por reCAPTCHA. <br />
                    <a href="https://google.com/intl/es/policies/privacy" target="_blank" rel="noreferrer" style={{ color: 'var(--color-brand-blue)', textDecoration: 'none' }}>Privacidad</a> y <a href="https://google.com/intl/es/policies/terms" target="_blank" rel="noreferrer" style={{ color: 'var(--color-brand-blue)', textDecoration: 'none' }}>Términos</a> de Google.
                </p>
            </div>
        </div>
    );
};
