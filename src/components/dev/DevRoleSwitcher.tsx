import type { FC } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/Card';

export const DevRoleSwitcher: FC = () => {
    const { user, impersonateRole, isLocalhost } = useAuth();

    if (!isLocalhost) return null;

    const roles = [
        { id: 'master', label: 'Super Admin (Master)' },
        { id: 'pastor', label: 'Pastor' },
        { id: 'leader', label: 'Líder' },
        { id: 'coordinator', label: 'Coordinador' },
        { id: 'member', label: 'Miembro' },
        { id: 'guest', label: 'Invitado' }
    ];

    return (
        <div style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            zIndex: 9999,
            maxWidth: '200px'
        }}>
            <Card style={{
                padding: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                border: '2px solid var(--color-brand-blue)',
                backgroundColor: 'var(--color-glass-surface)',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)', fontSize: '18px' }}>
                        visibility
                    </span>
                    <span className="text-overline" style={{ color: 'var(--color-brand-blue)', fontWeight: 700 }}>
                        VER COMO...
                    </span>
                </div>

                <select
                    value={user?.role?.name || ''}
                    onChange={(e) => impersonateRole(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border-subtle)',
                        backgroundColor: 'var(--color-ui-bg)',
                        color: 'var(--color-ui-text)',
                        fontSize: '13px',
                        outline: 'none'
                    }}
                >
                    {roles.map(role => (
                        <option key={role.id} value={role.id}>
                            {role.label}
                        </option>
                    ))}
                </select>

                <div
                    onClick={() => impersonateRole(null)}
                    style={{
                        marginTop: '8px',
                        textAlign: 'center',
                        fontSize: '11px',
                        color: 'gray',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                    }}
                >
                    Restablecer real
                </div>
            </Card>
        </div>
    );
};
