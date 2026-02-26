import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { useAuth } from '../../hooks/useAuth';

interface Activity {
    id: number;
    user_id: number;
    user_name: string;
    action: string;
    entity_type: string;
    entity_id: number;
    created_at: string;
    new_values: any;
}

export const ActivityFeed: FC = () => {
    const { t } = useTranslation();
    const { hasPermission, user } = useAuth();
    const [searchParams] = useSearchParams();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isAuthorized = hasPermission('users.view');

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const churchId = searchParams.get('church_id') || user?.churchId;
                const response = await fetch(`/api/activities?limit=30${churchId ? `&church_id=${churchId}` : ''}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setActivities(data.activities);
                    startStream(data.activities.length > 0 ? data.activities[0].id : 0);
                }
            } catch (err) {
                console.error('Error fetching activities:', err);
                setIsLoading(false);
            } finally {
                setIsLoading(false);
            }
        };

        let eventSource: EventSource | null = null;

        const startStream = (lastId: number) => {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const churchId = searchParams.get('church_id') || user?.churchId;
            const url = `/api/activities/stream?token=${encodeURIComponent(token)}&lastId=${lastId}${churchId ? `&church_id=${churchId}` : ''}`;
            eventSource = new EventSource(url);

            eventSource.onmessage = (event) => {
                const newActivity = JSON.parse(event.data);
                setActivities(prev => {
                    if (prev.find(a => a.id === newActivity.id)) return prev;
                    return [newActivity, ...prev].slice(0, 30);
                });
            };

            eventSource.onerror = (err) => {
                console.error('SSE Error:', err);
                eventSource?.close();
            };
        };

        fetchInitial();

        return () => {
            if (eventSource) eventSource.close();
        };
    }, []);

    const getActionIcon = (action: string) => {
        if (action.startsWith('song.')) return 'library_music';
        if (action.startsWith('user.')) return 'person';
        if (action.startsWith('team.') || action.startsWith('group.')) return 'groups';
        if (action.startsWith('meeting.')) return 'calendar_month';
        if (action.startsWith('playlist.')) return 'queue_music';
        return 'history';
    };

    const formatAction = (activity: Activity) => {
        const { action, user_name, new_values } = activity;
        const details = typeof new_values === 'string' ? JSON.parse(new_values) : new_values;

        const key = action.replace('.', '_');
        const translationKey = `dashboard.activity.actions.${key}`;

        // Pass common parameters
        const params = {
            user: user_name || t('people.roles.member'),
            title: details?.title || '',
            name: details?.name || '',
            action: action
        };

        const result = t(translationKey, params);

        // Fallback for unknown actions
        if (result === translationKey) {
            return t('dashboard.activity.actions.unknown', params);
        }

        return result;
    };

    // Filter sensitive activities
    const visibleActivities = activities.filter(activity => {
        const sensitive = ['user.invite', 'user.delete', 'user.status_update'];
        if (sensitive.includes(activity.action)) {
            return isAuthorized;
        }
        return true;
    });

    if (isLoading && visibleActivities.length === 0) {
        return <p className="text-overline" style={{ textAlign: 'center', padding: '20px' }}>{t('dashboard.activity.loading')}</p>;
    }

    return (
        <section>
            <h3 className="text-h2" style={{ marginBottom: '16px' }}>{t('dashboard.activity.title')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {visibleActivities.map(activity => (
                    <Card key={activity.id} style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            backgroundColor: 'var(--color-ui-surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-brand-blue)'
                        }}>
                            <span className="material-symbols-outlined">{getActionIcon(activity.action)}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                            <p className="text-body" style={{ fontWeight: 500, margin: 0 }}>{formatAction(activity)}</p>
                            <p className="text-overline" style={{ color: 'gray', marginTop: '2px' }}>
                                {new Date(activity.created_at).toLocaleString()}
                            </p>
                        </div>
                    </Card>
                ))}
                {visibleActivities.length === 0 && (
                    <p className="text-body" style={{ textAlign: 'center', color: 'gray', padding: '12px' }}>
                        {t('dashboard.activity.empty')}
                    </p>
                )}
            </div>
        </section>
    );
};
