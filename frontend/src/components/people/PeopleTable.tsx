import { type FC, type MouseEvent } from 'react';
import type { User } from '../../types/domain';
import { Button } from '../ui/Button';

interface PeopleTableProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onResend: (user: User) => void;
    activeMenu: number | null;
    setActiveMenu: (id: number | null) => void;
    getStatusText: (item: any) => string;
}

export const PeopleTable: FC<PeopleTableProps> = ({
    users, onEdit, onDelete, onResend, activeMenu, setActiveMenu, getStatusText
}) => {
    return (
        <div style={{
            backgroundColor: 'var(--color-card-bg)',
            borderRadius: '16px',
            border: '1px solid var(--color-border-subtle)',
            overflow: 'visible'
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ui-text-soft)' }}>Nombre / Rol</th>
                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ui-text-soft)' }}>Contacto</th>
                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ui-text-soft)' }}>Estado</th>
                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ui-text-soft)' }}>Áreas</th>
                        <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-ui-text-soft)', textAlign: 'right' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(item => (
                        <tr
                            key={item.id}
                            onClick={() => onEdit(item)}
                            style={{ borderBottom: '1px solid var(--color-border-subtle)', cursor: 'pointer' }}
                            className="table-row-hover"
                        >
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '12px',
                                        backgroundColor: (item.role?.name === 'pastor' || item.role?.name === 'admin' ? '#9333EA' : '#475569'),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold'
                                    }}>
                                        {item.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--color-ui-text)' }}>{item.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-ui-text-soft)' }}>{item.role?.displayName || 'Miembro'}</div>
                                    </div>
                                </div>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ fontSize: '14px', color: 'var(--color-ui-text)' }}>{item.email}</div>
                                {item.phone && <div style={{ fontSize: '12px', color: 'var(--color-ui-text-soft)' }}>{item.phone}</div>}
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                <span style={{
                                    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                                    padding: '4px 10px', borderRadius: '20px',
                                    backgroundColor: item.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    color: item.status === 'active' ? '#10B981' : '#F59E0B'
                                }}>
                                    {getStatusText(item)}
                                </span>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {item.areas?.map((a: any) => (
                                        <span key={a.id} style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', color: 'var(--color-ui-text-soft)' }}>
                                            {a.name}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative' }} className="card-menu-container" onClick={e => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        icon="more_vert"
                                        onClick={(e: MouseEvent) => { e.stopPropagation(); setActiveMenu(activeMenu === item.id ? null : item.id); }}
                                        style={{ minWidth: 'auto', padding: '8px' }}
                                    />
                                    {activeMenu === item.id && (
                                        <div className="dropdown-menu" style={{ right: 0, top: '40px', width: '200px' }}>
                                            {item.status === 'pending' ? (
                                                <div onClick={() => { onResend(item); setActiveMenu(null); }} className="dropdown-item">
                                                    <span className="material-symbols-outlined">send</span> Reenviar
                                                </div>
                                            ) : (
                                                <div onClick={() => { onEdit(item); setActiveMenu(null); }} className="dropdown-item">
                                                    <span className="material-symbols-outlined">edit</span> Editar
                                                </div>
                                            )}
                                            <div onClick={() => { onDelete(item); setActiveMenu(null); }} className="dropdown-item" style={{ color: 'var(--color-danger-red)' }}>
                                                <span className="material-symbols-outlined">delete</span> Eliminar
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
