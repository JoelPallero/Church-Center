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
            const redirectPath = searchParams.get('redirect') || '/dashboard';
            navigate(redirectPath, { replace: true });
        }
    }, [isAuthenticated, navigate, searchParams]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                    <h1 className="text-h1">{t('auth.signInTitle', { church: t('common.church') })}</h1>
                    <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: 'var(--color-brand-blue)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        letterSpacing: '0.05em',
                        lineHeight: 1
                    }}>
                        v1.0
                    </span>
                </div>
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
