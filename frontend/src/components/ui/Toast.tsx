import React from 'react';
import { useToast } from '../../context/ToastContext';
import type { Toast as ToastType } from '../../context/ToastContext';

export const Toast: React.FC<ToastType> = ({ id, message, type }) => {
    const { removeToast } = useToast();

    const getIcon = () => {
        switch (type) {
            case 'success': return 'check_circle';
            case 'error': return 'error';
            case 'warning': return 'warning';
            default: return 'info';
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success': return { bg: 'rgba(34, 197, 94, 0.15)', border: '#22C55E' };
            case 'error': return { bg: 'rgba(239, 68, 68, 0.15)', border: '#EF4444' };
            case 'warning': return { bg: 'rgba(245, 158, 11, 0.15)', border: '#F59E0B' };
            default: return { bg: 'rgba(61, 104, 223, 0.15)', border: '#3D68DF' };
        }
    };

    const colors = getColors();

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: 'var(--color-glass-surface)',
            backdropFilter: 'blur(16px) saturate(180%)',
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            color: 'var(--color-ui-text)',
            animation: 'slideInRight 0.3s ease-out forwards',
            minWidth: '280px',
            maxWidth: '400px',
            cursor: 'pointer'
        }} onClick={() => removeToast(id)}>
            <span className="material-symbols-outlined" style={{ color: colors.border }}>
                {getIcon()}
            </span>
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{message}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', opacity: 0.5 }}>
                close
            </span>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const { toasts } = useToast();

    return (
        <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            pointerEvents: 'none'
        }}>
            <div style={{ pointerEvents: 'auto' }}>
                {toasts.map((toast) => (
                    <Toast key={toast.id} {...toast} />
                ))}
            </div>
        </div>
    );
};
