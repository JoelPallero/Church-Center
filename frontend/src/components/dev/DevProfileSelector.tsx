import type { FC } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { MOCK_PROFILES } from '../../utils/mockData';

export const DevProfileSelector: FC = () => {
    const { isLocalhost, loginAsMock, isMockMode, user, logout } = useAuth();

    // Only render on localhost
    if (!isLocalhost) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(8px)',
            padding: '12px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '12px',
            maxWidth: '200px'
        }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>DEV MODE</span>
                {isMockMode && (
                    <button
                        onClick={() => logout()}
                        style={{
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            padding: '2px 6px',
                            fontSize: '10px',
                            cursor: 'pointer'
                        }}
                    >
                        Salir Mock
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
                {Object.keys(MOCK_PROFILES).map(key => {
                    const isActive = user?.role?.name === key && isMockMode;
                    return (
                        <button
                            key={key}
                            onClick={() => loginAsMock(key)}
                            style={{
                                textAlign: 'left',
                                padding: '6px 8px',
                                border: 'none',
                                borderRadius: '6px',
                                background: isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                                color: isActive ? 'white' : '#cbd5e1',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            }}
                            onMouseOut={(e) => {
                                if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                        >
                            {MOCK_PROFILES[key].user.role?.displayName}
                        </button>
                    );
                })}
            </div>

            {!user && (
                <div style={{ marginTop: '8px', opacity: 0.7, fontStyle: 'italic' }}>
                    Seleccioná un perfil para omitir el login
                </div>
            )}
        </div>
    );
};
