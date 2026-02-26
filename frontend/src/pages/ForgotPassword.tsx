import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const ForgotPassword: FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: data.message });
            } else {
                setMessage({ type: 'error', text: data.error || t('auth.resetError') });
            }
        } catch (err) {
            setMessage({ type: 'error', text: t('common.connectionError') });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', padding: '24px', backgroundColor: 'var(--color-ui-surface)'
        }}>
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-brand-blue)' }}>lock_reset</span>
                <h1 className="text-h1" style={{ marginTop: '16px' }}>{t('auth.forgotPasswordTitle')}</h1>
                <p className="text-body" style={{ color: '#6B7280' }}>{t('auth.forgotPasswordSubtitle')}</p>
            </div>

            <Card style={{ padding: '32px', width: '100%', maxWidth: '400px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {message && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: message.type === 'success' ? '#10B981' : '#EF4444',
                            borderRadius: '12px', fontSize: '14px', textAlign: 'center'
                        }}>
                            {message.text}
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

                    <Button
                        type="submit"
                        label={isLoading ? t('common.sending') : t('auth.sendLink')}
                        variant="primary"
                        disabled={isLoading}
                        style={{ width: '100%', marginTop: '8px' }}
                    />
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Link to="/login" style={{ color: 'var(--color-brand-blue)', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>
                        {t('auth.backToLogin')}
                    </Link>
                </div>
            </Card>
        </div>
    );
};
