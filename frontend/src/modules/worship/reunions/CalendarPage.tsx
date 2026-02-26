import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { MeetingForm } from '../../../components/reunions/MeetingForm';
import { MeetingDetailView } from '../../../components/reunions/MeetingDetailView';
import api from '../../../services/api';

interface MeetingInstance {
    id: number;
    title: string;
    instance_date: string;
    start_datetime_utc: string;
    end_datetime_utc: string;
    meeting_type: 'recurrent' | 'special';
    status: 'scheduled' | 'cancelled' | 'completed';
    location: string;
    team_count: number;
    setlist_count: number;
}

export const CalendarPage: FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isMaster, user } = useAuth();
    const [instances, setInstances] = useState<MeetingInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [currentDate, setCurrentDate] = useState(new Date());

    const churchId = searchParams.get('church_id') ? parseInt(searchParams.get('church_id')!) : null;
    const isPastor = user?.role?.name === 'pastor';
    const finalChurchId = churchId || user?.churchId;

    useEffect(() => {
        // Redirect if no church context at all and user is Master or Pastor (multitenant context)
        if (!finalChurchId && (isMaster || isPastor)) {
            navigate('/mainhub/select-church/calendar');
            return;
        }
        fetchInstances();
    }, [finalChurchId, isMaster, isPastor, navigate, currentDate]);

    const fetchInstances = async () => {
        try {
            const params: { month: number; year: number; church_id?: number } = {
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear()
            };
            if (finalChurchId) {
                params.church_id = finalChurchId;
            }

            const response = await api.get('/calendar/events', {
                params: params
            });
            // const response = await fetch(url, { // Original fetch call
            //     headers: { 'Authorization': `Bearer ${token}` }
            // });
            const data = response.data; // Assuming api service returns data directly
            if (data.success) {
                setInstances(data.instances);
            }
        } catch (err) {
            console.error('Error fetching calendar:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (isoStr: string) => {
        const date = new Date(isoStr);
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    return (
        <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 className="text-h1">{t('reunions.title')}</h1>
                    <p className="text-body" style={{ color: '#9CA3AF' }}>{t('reunions.description')}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        padding: '4px',
                        borderRadius: '12px',
                        display: 'flex',
                        gap: '4px',
                        border: '1px solid var(--color-border-subtle)'
                    }}>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: viewMode === 'list' ? 'var(--color-brand-blue)' : 'transparent',
                                color: viewMode === 'list' ? 'white' : 'var(--color-ui-text-soft)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>list</span>
                            {t('reunions.viewList')}
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                backgroundColor: viewMode === 'calendar' ? 'var(--color-brand-blue)' : 'transparent',
                                color: viewMode === 'calendar' ? 'white' : 'var(--color-ui-text-soft)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>calendar_view_month</span>
                            {t('reunions.viewCalendar')}
                        </button>
                    </div>
                    <Button label={t('reunions.newMeeting')} icon="add" onClick={() => setIsModalOpen(true)} />
                </div>
            </header>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={t('reunions.newMeeting')}
            >
                <MeetingForm
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchInstances();
                    }}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>

            <Modal
                isOpen={!!selectedInstanceId}
                onClose={() => setSelectedInstanceId(null)}
                title={t('reunions.details')}
            >
                {selectedInstanceId && (
                    <MeetingDetailView
                        instanceId={selectedInstanceId}
                        onClose={() => setSelectedInstanceId(null)}
                    />
                )}
            </Modal>

            {isLoading ? (
                <div className="flex-center" style={{ height: '300px' }}>
                    <div className="spinner" />
                </div>
            ) : viewMode === 'list' ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                    {instances.map(instance => (
                        <Card key={instance.id} style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '16px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-brand-blue)', textTransform: 'uppercase' }}>
                                        {new Date(instance.instance_date).toLocaleDateString(i18n.language, { month: 'short' })}
                                    </span>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-brand-blue)' }}>
                                        {new Date(instance.instance_date).getDate()}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-h3" style={{ margin: 0 }}>{instance.title}</h3>
                                    <div style={{ display: 'flex', gap: '12px', color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                                            {formatTime(instance.start_datetime_utc)}
                                        </span>
                                        {instance.location && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>location_on</span>
                                                {instance.location}
                                            </span>
                                        )}
                                        <span className={`status-badge ${instance.meeting_type === 'recurrent' ? 'status-active' : 'status-pending'}`} style={{ fontSize: '10px' }}>
                                            {instance.meeting_type === 'recurrent' ? t('reunions.status.recurrent') : t('reunions.status.special')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p className="text-overline" style={{ color: instance.team_count > 0 ? '#10B981' : '#F59E0B' }}>
                                        {instance.team_count > 0 ? t('reunions.status.withTeam') : t('reunions.status.noTeam')}
                                    </p>
                                    <p className="text-body" style={{ fontSize: '12px', margin: 0 }}>{t('reunions.assignedMembers', { count: instance.team_count })}</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p className="text-overline" style={{ color: instance.setlist_count > 0 ? '#10B981' : '#F59E0B' }}>
                                        {instance.setlist_count > 0 ? t('reunions.status.withSetlist') : t('reunions.status.noSetlist')}
                                    </p>
                                    <p className="text-body" style={{ fontSize: '12px', margin: 0 }}>{t('reunions.songCount', { count: instance.setlist_count })}</p>
                                </div>
                                <Button variant="secondary" icon="chevron_right" onClick={() => setSelectedInstanceId(instance.id)} />
                            </div>
                        </Card>
                    ))}

                    {instances.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px', opacity: 0.6 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>calendar_today</span>
                            <p className="text-body">{t('reunions.noMeetings')}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    {/* Monthly Navigation */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 className="text-h2" style={{ textTransform: 'capitalize' }}>
                            {currentDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
                        </h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button
                                variant="secondary"
                                icon="chevron_left"
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                            />
                            <Button
                                variant="secondary"
                                label={t('reunions.today')}
                                onClick={() => setCurrentDate(new Date())}
                            />
                            <Button
                                variant="secondary"
                                icon="chevron_right"
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                            />
                        </div>
                    </div>

                    <Card style={{ padding: '0', overflow: 'hidden' }}>
                        {/* Weekday Headers */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            borderBottom: '1px solid var(--color-border-subtle)'
                        }}>
                            {(() => {
                                const weekDays = [
                                    t('days.1').substring(0, 3), // Monday
                                    t('days.2').substring(0, 3), // Tuesday
                                    t('days.3').substring(0, 3), // Wednesday
                                    t('days.4').substring(0, 3), // Thursday
                                    t('days.5').substring(0, 3), // Friday
                                    t('days.6').substring(0, 3), // Saturday
                                    t('days.0').substring(0, 3)  // Sunday
                                ];
                                return weekDays.map(day => (
                                    <div key={day} style={{ padding: '12px', textAlign: 'center' }}>
                                        <span className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>{day}</span>
                                    </div>
                                ));
                            })()}
                        </div>

                        {/* Calendar Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                            {(() => {
                                const year = currentDate.getFullYear();
                                const month = currentDate.getMonth();
                                const firstDayOfMonth = new Date(year, month, 1);
                                const lastDayOfMonth = new Date(year, month + 1, 0);

                                // Adjust to start on Monday (JS Date: 0=Sun, 1=Mon... -> adjustment: (day+6)%7)
                                const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
                                const totalDays = lastDayOfMonth.getDate();

                                const days = [];
                                // Padding from previous month
                                const prevMonthLastDay = new Date(year, month, 0).getDate();
                                for (let i = firstDayIndex - 1; i >= 0; i--) {
                                    days.push({ day: prevMonthLastDay - i, currentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
                                }
                                // Days of current month
                                for (let i = 1; i <= totalDays; i++) {
                                    days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
                                }
                                // Padding from next month
                                const remainingRows = Math.ceil(days.length / 7);
                                const totalCells = remainingRows * 7;
                                const nextMonthPadding = totalCells - days.length;
                                for (let i = 1; i <= nextMonthPadding; i++) {
                                    days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
                                }

                                return days.map((dayObj, idx) => {
                                    // Find events for this day
                                    // We need to compare dates. Since instance_date is YYYY-MM-DD
                                    const dayStr = dayObj.date.toISOString().split('T')[0];
                                    const dayEvents = instances.filter(inst => inst.instance_date === dayStr);

                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                minHeight: '120px',
                                                borderRight: idx % 7 === 6 ? 'none' : '1px solid var(--color-border-subtle)',
                                                borderBottom: idx >= totalCells - 7 ? 'none' : '1px solid var(--color-border-subtle)',
                                                padding: '8px',
                                                backgroundColor: dayObj.currentMonth ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '4px'
                                            }}
                                        >
                                            <span style={{
                                                fontSize: '12px',
                                                fontWeight: dayObj.currentMonth ? '600' : '400',
                                                opacity: dayObj.currentMonth ? 1 : 0.5,
                                                marginBottom: '4px',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                backgroundColor: dayStr === new Date().toISOString().split('T')[0] ? 'var(--color-brand-blue)' : 'transparent',
                                                color: dayStr === new Date().toISOString().split('T')[0] ? 'white' : (dayObj.currentMonth ? 'var(--color-ui-text)' : 'var(--color-ui-text-soft)')
                                            }}>
                                                {dayObj.day}
                                            </span>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', maxHeight: '80px' }}>
                                                {dayEvents.map(event => (
                                                    <div
                                                        key={event.id}
                                                        onClick={() => setSelectedInstanceId(event.id)}
                                                        style={{
                                                            fontSize: '10px',
                                                            padding: '4px 6px',
                                                            borderRadius: '6px',
                                                            backgroundColor: event.meeting_type === 'recurrent' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                            color: event.meeting_type === 'recurrent' ? '#3B82F6' : '#F59E0B',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            cursor: 'pointer',
                                                            borderLeft: `3px solid ${event.meeting_type === 'recurrent' ? '#3B82F6' : '#F59E0B'}`,
                                                            transition: 'transform 0.1s'
                                                        }}
                                                        title={`${formatTime(event.start_datetime_utc)} - ${event.title}`}
                                                    >
                                                        <b>{formatTime(event.start_datetime_utc)}</b> {event.title}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};


