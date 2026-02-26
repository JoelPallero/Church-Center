import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

interface NotificationCenterProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NotificationCenter: FC<NotificationCenterProps> = ({ isOpen, onOpenChange }) => {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (onOpenChange) onOpenChange(isOpen);
    }, [isOpen, onOpenChange]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onOpenChange(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            if (response.data.success) {
                setNotifications(response.data.notifications || []);
                setUnreadCount(response.data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to fetch notifications');
        }
    };

    const markAsRead = async (id: number, link?: string) => {
        try {
            const response = await api.post(`/notifications/${id}/read`);
            if (response.data.success) {
                fetchNotifications();
                if (link) {
                    onOpenChange(false);
                    navigate(link);
                }
            }
        } catch (error) {
            console.error('Failed to mark as read');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'membership_accepted': return 'verified_user';
            case 'team_assignment': return 'groups';
            case 'setlist_published': return 'queue_music';
            case 'new_song': return 'library_music';
            case 'profile_incomplete': return 'contact_support';
            default: return 'notifications';
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => onOpenChange(!isOpen)}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
                    color: 'var(--color-ui-text)', display: 'flex', alignItems: 'center',
                    padding: '8px', borderRadius: '50%',
                    backgroundColor: isOpen ? 'rgba(255,255,255,0.05)' : 'transparent'
                }}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>notifications</span>
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '4px', right: '4px', backgroundColor: '#EF4444',
                        color: 'white', borderRadius: '50%', width: '16px', height: '16px',
                        fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', border: '2px solid var(--color-glass-surface)'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '340px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 className="text-body" style={{ margin: 0, fontWeight: 700 }}>{t('notifications.title')}</h4>
                        {unreadCount > 0 && <span className="text-overline" style={{ color: 'var(--color-brand-blue)' }}>{t('notifications.new_count', { count: unreadCount })}</span>}
                    </div>
                    <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'rgba(255,255,255,0.1)', marginBottom: '12px' }}>notifications_off</span>
                                <p className="text-body" style={{ color: 'gray', margin: 0 }}>{t('notifications.empty')}</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => markAsRead(n.id, n.link)}
                                    className="dropdown-item"
                                    style={{
                                        display: 'flex',
                                        gap: '12px',
                                        padding: '14px 16px',
                                        backgroundColor: n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.08)',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '10px',
                                        backgroundColor: n.is_read ? 'rgba(255,255,255,0.05)' : 'rgba(59, 130, 246, 0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <span className="material-symbols-outlined" style={{
                                            fontSize: '20px',
                                            color: n.is_read ? '#94A3B8' : 'var(--color-brand-blue)'
                                        }}>
                                            {getIcon(n.type)}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p className="text-body" style={{
                                            margin: '0 0 4px 0',
                                            fontSize: '14px',
                                            fontWeight: n.is_read ? 400 : 600,
                                            color: n.is_read ? '#CBD5E1' : '#F1F5F9',
                                            lineHeight: '1.4'
                                        }}>
                                            {n.message}
                                        </p>
                                        <span className="text-label" style={{ fontSize: '11px', color: '#64748B' }}>
                                            {new Date(n.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    {!n.is_read && (
                                        <div style={{
                                            width: '8px', height: '8px', borderRadius: '50%',
                                            backgroundColor: 'var(--color-brand-blue)', marginTop: '6px'
                                        }} />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
