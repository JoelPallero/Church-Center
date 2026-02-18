import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const ResetPassword: FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const response = await fetch('/api/reset_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });
            const data = await response.json();

            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setMessage({ type: 'error', text: data.error || 'Hubo un error al actualizar la contraseña.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error de conexión con el servidor.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
                <Card style={{ padding: '32px', textAlign: 'center' }}>
                    <h2 className="text-h2" style={{ color: '#EF4444' }}>Link inválido</h2>
                    <p className="text-body" style={{ marginTop: '16px' }}>El token de restauración no está presente.</p>
                    <Button label="Volver al Login" variant="ghost" onClick={() => navigate('/login')} style={{ marginTop: '24px' }} />
                </Card>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', padding: '24px', backgroundColor: 'var(--color-ui-surface)'
        }}>
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-brand-blue)' }}>password</span>
                <h1 className="text-h1" style={{ marginTop: '16px' }}>Nueva Contraseña</h1>
                <p className="text-body" style={{ color: '#6B7280' }}>Ingresa tu nueva clave de acceso</p>
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
                        <label className="text-overline" style={{ color: '#6B7280' }}>NUEVA CONTRASEÑA</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full"
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label className="text-overline" style={{ color: '#6B7280' }}>CONFIRMAR CONTRASEÑA</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full"
                        />
                    </div>

                    <Button
                        type="submit"
                        label={isLoading ? "Guardando..." : "Actualizar Contraseña"}
                        variant="primary"
                        disabled={isLoading}
                        style={{ width: '100%', marginTop: '8px' }}
                    />
                </form>
            </Card>
        </div>
    );
};
