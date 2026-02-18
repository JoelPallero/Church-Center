import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface Role {
    id: number;
    name: string;
    display_name: string;
    level: number;
}

interface Permission {
    id: number;
    name: string;
    display_name: string;
    module: string;
    description: string;
}

export const PermissionsManager: FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [rolePermissions, setRolePermissions] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        loadBaseData();
    }, []);

    useEffect(() => {
        if (selectedRoleId) {
            loadRolePermissions(selectedRoleId);
        }
    }, [selectedRoleId]);

    const loadBaseData = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('auth_token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [rolesRes, permsRes] = await Promise.all([
                fetch('/api/admin/permissions.php?action=roles', { headers }),
                fetch('/api/admin/permissions.php?action=all_permissions', { headers })
            ]);

            const rolesData = await rolesRes.json();
            const permsData = await permsRes.json();

            setRoles(rolesData);
            setAllPermissions(permsData);
            if (rolesData.length > 0) {
                setSelectedRoleId(rolesData[0].id);
            }
        } catch (err) {
            console.error('Error loading permissions data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadRolePermissions = async (roleId: number) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/admin/permissions.php?action=role_permissions&role_id=${roleId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setRolePermissions(data.map((id: string | number) => Number(id)));
        } catch (err) {
            console.error('Error loading role permissions:', err);
        }
    };

    const handleTogglePermission = (id: number) => {
        setRolePermissions(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        if (!selectedRoleId) return;
        try {
            setIsSaving(true);
            setMessage(null);
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/admin/permissions.php?action=update', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role_id: selectedRoleId,
                    permission_ids: rolePermissions
                })
            });

            const result = await response.json();
            if (result.success) {
                setMessage({ text: 'Permisos actualizados correctamente', type: 'success' });
            } else {
                setMessage({ text: result.message || 'Error al guardar', type: 'error' });
            }
        } catch (err) {
            setMessage({ text: 'Error de conexión', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    // Group permissions by module
    const groupedPermissions = allPermissions.reduce((acc, perm) => {
        if (!acc[perm.module]) acc[perm.module] = [];
        acc[perm.module].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    if (isLoading) {
        return (
            <div className="flex-center" style={{ height: '300px' }}>
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <header style={{ marginBottom: '24px' }}>
                <h1 className="text-h1">Configurar Permisos</h1>
                <p className="text-body" style={{ color: 'gray' }}>Define qué acciones puede realizar cada rol del sistema.</p>
            </header>

            <Card style={{ padding: '20px' }}>
                <label className="text-overline" style={{ display: 'block', marginBottom: '8px', color: 'gray' }}>Seleccionar Rol</label>
                <select
                    value={selectedRoleId || ''}
                    onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border-subtle)',
                        backgroundColor: 'var(--color-ui-bg)',
                        color: 'var(--color-ui-text)',
                        fontSize: '16px',
                        outline: 'none'
                    }}
                >
                    {roles.map(role => (
                        <option key={role.id} value={role.id}>
                            {role.display_name} (Nivel {role.level})
                        </option>
                    ))}
                </select>
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {Object.entries(groupedPermissions).map(([module, perms]) => (
                    <section key={module}>
                        <h3 className="text-overline" style={{ color: 'var(--color-brand-blue)', marginBottom: '12px', fontSize: '12px' }}>
                            Módulo: {module.toUpperCase()}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {perms.map(perm => (
                                <Card
                                    key={perm.id}
                                    onClick={() => handleTogglePermission(perm.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        border: rolePermissions.includes(perm.id)
                                            ? '1px solid var(--color-brand-blue)'
                                            : '1px solid var(--color-border-subtle)',
                                        backgroundColor: rolePermissions.includes(perm.id)
                                            ? 'rgba(59, 130, 246, 0.05)'
                                            : 'var(--color-card-bg)'
                                    }}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '6px',
                                        border: '2px solid' + (rolePermissions.includes(perm.id) ? ' var(--color-brand-blue)' : ' gray'),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: rolePermissions.includes(perm.id) ? 'var(--color-brand-blue)' : 'transparent',
                                        transition: 'all 0.2s'
                                    }}>
                                        {rolePermissions.includes(perm.id) && (
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'white' }}>check</span>
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p className="text-body" style={{ fontWeight: 600, margin: 0, fontSize: '14px' }}>{perm.display_name}</p>
                                        <p className="text-overline" style={{ color: 'gray', textTransform: 'none', letterSpacing: 'normal', fontSize: '11px' }}>
                                            {perm.description}
                                        </p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {message && (
                <div style={{
                    marginTop: '24px',
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: message.type === 'success' ? '#10B981' : '#EF4444',
                    textAlign: 'center'
                }} className="text-overline">
                    {message.text}
                </div>
            )}

            <div style={{ marginTop: '32px', position: 'sticky', bottom: '24px' }}>
                <Button
                    variant="primary"
                    label={isSaving ? "Guardando..." : "Guardar Cambios"}
                    disabled={isSaving}
                    onClick={handleSave}
                    style={{ width: '100%', padding: '16px' }}
                />
            </div>
        </div>
    );
};
