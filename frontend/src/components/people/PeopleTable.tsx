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
            borderRadius: '20px',
            border: '1px solid var(--color-border-subtle)',
            overflow: 'visible',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left' }}>
                <thead>
                    <tr style={{ backgroundColor: 'transparent' }}>
                        <th style={{
                            padding: '16px 24px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                            color: 'var(--color-ui-text-soft)', letterSpacing: '0.05em',
                            borderTopLeftRadius: '20px',
                            backgroundColor: 'var(--color-ui-surface)',
                            borderBottom: '1px solid var(--color-border-subtle)'
                        }}>
                            Nombre / Rol
                        </th>
                        <th style={{
                            padding: '16px 24px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                            color: 'var(--color-ui-text-soft)', letterSpacing: '0.05em',
                            backgroundColor: 'var(--color-ui-surface)',
                            borderBottom: '1px solid var(--color-border-subtle)'
                        }}>
                            Contacto
                        </th>
                        <th style={{
                            padding: '16px 24px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                            color: 'var(--color-ui-text-soft)', letterSpacing: '0.05em',
                            backgroundColor: 'var(--color-ui-surface)',
                            borderBottom: '1px solid var(--color-border-subtle)'
                        }}>
                            Estado
                        </th>
                        <th style={{
                            padding: '16px 24px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                            color: 'var(--color-ui-text-soft)', letterSpacing: '0.05em',
                            backgroundColor: 'var(--color-ui-surface)',
                            borderBottom: '1px solid var(--color-border-subtle)'
                        }}>
                            Áreas
                        </th>
                        <th style={{
                            padding: '16px 24px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase',
                            color: 'var(--color-ui-text-soft)', letterSpacing: '0.05em', textAlign: 'right',
                            borderTopRightRadius: '20px',
                            backgroundColor: 'var(--color-ui-surface)',
                            borderBottom: '1px solid var(--color-border-subtle)'
                        }}>
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody style={{ backgroundColor: 'var(--color-card-bg)' }}>
                    {users.map((item, idx) => (
                        <tr
                            key={item.id}
                            onClick={() => onEdit(item)}
                            style={{
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            className="table-row-hover"
                        >
                            <td style={{
                                padding: '16px 24px',
                                borderBottomLeftRadius: idx === users.length - 1 ? '20px' : '0',
                                borderBottom: idx === users.length - 1 ? 'none' : '1px solid var(--color-border-subtle)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '12px',
                                        backgroundColor: (item.role?.name === 'pastor' || item.role?.name === 'admin' ? '#9333EA' : 'var(--color-ui-surface)'),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: (item.role?.name === 'pastor' || item.role?.name === 'admin' ? 'white' : 'var(--color-ui-text)'),
                                        fontWeight: 700,
                                        fontSize: '16px'
                                    }}>
                                        {item.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--color-ui-text)', fontSize: '15px' }}>{item.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-ui-text-soft)' }}>{item.role?.displayName || 'Miembro'}</div>
                                    </div>
                                </div>
                            </td>
                            <td style={{
                                padding: '16px 24px',
                                borderBottom: idx === users.length - 1 ? 'none' : '1px solid var(--color-border-subtle)'
                            }}>
                                <div style={{ fontSize: '14px', color: 'var(--color-ui-text)' }}>{item.email}</div>
                                {item.phone && <div style={{ fontSize: '12px', color: 'var(--color-ui-text-soft)' }}>{item.phone}</div>}
                            </td>
                            <td style={{
                                padding: '16px 24px',
                                borderBottom: idx === users.length - 1 ? 'none' : '1px solid var(--color-border-subtle)'
                            }}>
                                <span style={{
                                    fontSize: '10px', fontWeight: 800, textTransform: 'uppercase',
                                    padding: '4px 10px', borderRadius: '20px',
                                    backgroundColor: item.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    color: item.status === 'active' ? '#10B981' : '#F59E0B',
                                    letterSpacing: '0.02em'
                                }}>
                                    {getStatusText(item)}
                                </span>
                            </td>
                            <td style={{
                                padding: '16px 24px',
                                borderBottom: idx === users.length - 1 ? 'none' : '1px solid var(--color-border-subtle)'
                            }}>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {item.areas?.map((a: any) => (
                                        <span key={a.id} style={{
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            padding: '2px 10px',
                                            borderRadius: '6px',
                                            backgroundColor: 'var(--color-ui-surface)',
                                            border: '1px solid var(--color-border-subtle)',
                                            color: 'var(--color-ui-text-soft)',
                                            textTransform: 'uppercase'
                                        }}>
                                            {a.name}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td style={{
                                padding: '16px 24px',
                                textAlign: 'right',
                                borderBottomRightRadius: idx === users.length - 1 ? '20px' : '0',
                                borderBottom: idx === users.length - 1 ? 'none' : '1px solid var(--color-border-subtle)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative' }} className="card-menu-container" onClick={e => e.stopPropagation()}>
                                    <Button
                                        variant="ghost"
                                        icon="more_vert"
                                        onClick={(e: MouseEvent) => { e.stopPropagation(); setActiveMenu(activeMenu === item.id ? null : item.id); }}
                                        style={{ minWidth: 'auto', padding: '8px', color: 'var(--color-ui-text-soft)' }}
                                    />
                                    {activeMenu === item.id && (
                                        <div className="dropdown-menu" style={{ right: 0, top: '40px', width: '200px' }}>
                                            {item.status === 'pending' ? (
                                                <div onClick={() => { onResend(item); setActiveMenu(null); }} className="dropdown-item">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span> Reenviar
                                                </div>
                                            ) : (
                                                <div onClick={() => { onEdit(item); setActiveMenu(null); }} className="dropdown-item">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span> Editar
                                                </div>
                                            )}
                                            <div className="dropdown-divider" />
                                            <div onClick={() => { onDelete(item); setActiveMenu(null); }} className="dropdown-item" style={{ color: 'var(--color-danger-red)' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span> Eliminar
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
