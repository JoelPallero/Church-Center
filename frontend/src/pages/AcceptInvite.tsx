import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const AcceptInvite: FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(true);
    const [invitation, setInvitation] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Falta el token de invitación.');
            setIsLoading(false);
            return;
        }

        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            const response = await fetch(`/api/auth/verify-invite?token=${token}`);
            const data = await response.json();
            if (data.success) {
                setInvitation(data.invitation);
            } else {
                setError(data.error || 'La invitación no es válida.');
            }
        } catch (err) {
            setError('Error al verificar la invitación.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/accept-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });
            const data = await response.json();
            if (data.success) {
                // Auto-login: Store token and user
                localStorage.setItem('auth_token', data.token);

                setSuccess(true);
                // The App will reload bootstrap on the next page since we changed localStorage
                setTimeout(() => {
                    window.location.href = '/join-teams';
                }, 1500);
            } else {
                setError(data.error || 'No se pudo completar el registro.');
            }
        } catch (err) {
            setError('Error de conexión.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-center" style={{ height: '100vh', backgroundColor: 'var(--color-ui-bg)' }}>
                <p className="text-body" style={{ color: 'var(--color-ui-text)' }}>Verificando invitación...</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex-center" style={{ height: '100vh', backgroundColor: 'var(--color-ui-bg)', padding: '24px' }}>
                <Card style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)', fontSize: '48px', marginBottom: '16px' }}>check_circle</span>
                    <h1 className="text-h1">¡Registro Completado!</h1>
                    <p className="text-body" style={{ color: '#9CA3AF', marginTop: '16px' }}>
                        Tu cuenta ha sido activada con éxito. Serás redirigido en unos segundos...
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex-center" style={{ minHeight: '100vh', backgroundColor: 'var(--color-ui-bg)', padding: '24px' }}>
            <Card style={{ maxWidth: '440px', width: '100%', padding: '32px' }}>
                <header style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--color-brand-blue)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                    }}>
                        <span className="material-symbols-outlined" style={{ color: 'white' }}>church</span>
                    </div>
                    <h1 className="text-h1">{invitation?.church || 'Bienvenido'}</h1>
                    {invitation && (
                        <p className="text-body" style={{ color: '#9CA3AF', marginTop: '8px' }}>
                            Hola <strong>{invitation.name}</strong>, configurá tu acceso para comenzar.
                        </p>
                    )}
                </header>

                {error ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#EF4444', marginBottom: '24px', fontSize: '14px'
                        }}>
                            {error}
                        </div>
                        <Button label="Volver al Inicio" onClick={() => navigate('/login')} variant="ghost" style={{ width: '100%' }} />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '8px', color: '#6B7280' }}>NUEVA CONTRASEÑA</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-border-subtle)',
                                    backgroundColor: 'var(--color-ui-surface)', color: 'var(--color-ui-text)', outline: 'none'
                                }}
                            />
                        </div>
                        <div>
                            <label className="text-overline" style={{ display: 'block', marginBottom: '8px', color: '#6B7280' }}>CONFIRMAR CONTRASEÑA</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-border-subtle)',
                                    backgroundColor: 'var(--color-ui-surface)', color: 'var(--color-ui-text)', outline: 'none'
                                }}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            label={isSubmitting ? "Completando..." : "Activar Cuenta"}
                            disabled={isSubmitting}
                            style={{ marginTop: '12px', padding: '14px' }}
                        />
                    </form>
                )}

                <footer style={{ marginTop: '32px', textAlign: 'center' }}>
                    <p className="text-overline" style={{ color: '#4B5563' }}>
                        © 2024 MinistryHub<br />
                        Plataforma de Gestión Ministerial
                    </p>
                </footer>
            </Card>
        </div>
    );
};
