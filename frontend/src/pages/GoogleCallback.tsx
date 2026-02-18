import type { FC } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const GoogleCallback: FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            const error = params.get('error');

            if (token) {
                localStorage.setItem('auth_token', token);
                // Small delay to ensure storage is settled
                setTimeout(() => {
                    window.location.href = '/';
                }, 100);
            } else if (error) {
                console.error('Google Auth Error:', error);
                navigate('/login?error=' + encodeURIComponent(error));
            } else {
                // If we get here without parameters, something went wrong
                navigate('/login');
            }
        };

        handleCallback();
    }, [navigate]);

    return (
        <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '20px' }}>
            <div className="spinner" />
            <p className="text-overline" style={{ color: '#6B7280' }}>Verificando cuenta con Google...</p>
        </div>
    );
};
