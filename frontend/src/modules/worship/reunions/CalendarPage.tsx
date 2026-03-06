import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
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
    category?: string;
    team_count: number;
    setlist_count: number;
}

export const CalendarPage: FC = () => {
    const { t, i18n } = useTranslation();
    const [searchParams] = useSearchParams();
    const { isMaster, user, hasRole } = useAuth();
    const [instances, setInstances] = useState<MeetingInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'calendar' | 'meetings'>('calendar');
    const [meetingsViewMode, setMeetingsViewMode] = useState<'list' | 'grid'>('grid'); // Tab Reuniones has its own view toggle
    const [showFilters, setShowFilters] = useState(false); // Toggle for advanced filters
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    // Filters for Reuniones tab
    const [filters, setFilters] = useState({
        search: '',
        type: 'all',
        category: 'all',
        dateFrom: '',
        dateTo: ''
    });

    const churchId = searchParams.get('church_id') ? parseInt(searchParams.get('church_id')!) : null;
    const isPastor = user?.role?.name === 'pastor' || hasRole('pastor');
    const isLeader = user?.role?.name === 'leader' || hasRole('leader');
    const finalChurchId = churchId || user?.churchId;

    const canManageMeetings = isMaster || isPastor || isLeader;

    const logInteraction = (action: string, data: any = {}) => {
        console.log(`[Calendar Interaction] ${action}`, {
            user: user?.id,
            role: user?.role?.name,
            isMaster,
            finalChurchId,
            ...data,
            timestamp: new Date().toISOString()
        });
    };

    const categories = [
        'Ensayos', 'Evento', 'Taller', 'Congreso', 'Cambios de horario',
        'Reuniones que no cambian', 'Reunión de jóvenes', 'Reunión de adolescentes',
        'Reunión de preadolescentes', 'Reunión de mujeres', 'Reunión de hombres',
        'Ocasional', 'Especial', 'Equipo'
    ];

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'Ensayos': '#EF4444',
            'Reunión de jóvenes': '#3B82F6',
            'Reunión de adolescentes': '#10B982',
            'Reunión de preadolescentes': '#8B5CF6',
            'Reunión de mujeres': '#EC4899',
            'Reunión de hombres': '#6366F1',
            'Evento': '#F59E0B',
            'Congreso': '#F97316',
            'Taller': '#06B6D4',
            'Cambios de horario': '#DC2626',
            'Reuniones que no cambian': '#059669',
            'Ocasional': '#FCD34D',
            'Especial': '#FB923C',
            'Equipo': '#4F46E5',
            'Reuniones ocasionales': '#FCD34D',
            'Reuniones especiales': '#FB923C',
            'Reuniones de equipos': '#4F46E5'
        };

        // Generate a random stable color for custom categories if not in the list
        if (!colors[category]) {
            let hash = 0;
            for (let i = 0; i < category.length; i++) {
                hash = category.charCodeAt(i) + ((hash << 5) - hash);
            }
            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
            return "#" + "00000".substring(0, 6 - c.length) + c;
        }

        return colors[category];
    };

    const shouldShowTag = (instance: MeetingInstance) => {
        if (!instance.category) return false;
        if (instance.meeting_type === 'recurrent') return true;

        const meetingDate = new Date(instance.instance_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Hide special meeting tags if they are in the past
        return meetingDate >= today;
    };


    useEffect(() => {
        if (finalChurchId) {
            fetchInstances();
        } else {
            setIsLoading(false);
        }
    }, [finalChurchId, isMaster, isPastor, currentDate, activeTab]);

    const fetchInstances = async () => {
        setIsLoading(true);
        try {
            const params: any = {};

            // In both tabs, we might benefit from having everything for the current month
            // or all meetings for the list.
            if (activeTab === 'calendar') {
                params.month = currentDate.getMonth() + 1;
                params.year = currentDate.getFullYear();
            }

            if (finalChurchId) {
                params.church_id = finalChurchId;
            }

            const response = await api.get('/calendar/events', {
                params: params
            });
            const data = response.data;
            if (data.success) {
                const rawInstances = data.instances || [];

                // If it's the calendar view, we need to expand recurrent meetings into actual instances
                if (activeTab === 'calendar') {
                    const expanded: MeetingInstance[] = [];
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();

                    rawInstances.forEach((inst: any) => {
                        if (inst.meeting_type === 'recurrent') {
                            // Find all occurrences of this day_of_week in the current month
                            const dayOfWeek = inst.day_of_week ?? 0;
                            const lastOfMonth = new Date(year, month + 1, 0);

                            for (let d = 1; d <= lastOfMonth.getDate(); d++) {
                                const date = new Date(year, month, d);
                                if (date.getDay() === parseInt(dayOfWeek as any)) {
                                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                    expanded.push({
                                        ...inst,
                                        instance_date: dateStr,
                                        start_datetime_utc: `${dateStr}T${inst.start_time || '00:00:00'}`,
                                        end_datetime_utc: `${dateStr}T${inst.end_time || '00:00:00'}`
                                    });
                                }
                            }
                        } else if (inst.instance_date) {
                            expanded.push(inst);
                        }
                    });
                    setInstances(expanded);
                } else {
                    setInstances(rawInstances);
                }
            }
        } catch (err) {
            console.error('Error fetching calendar:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewMeeting = () => {
        logInteraction('Click Nueva Reunión');
        if (!isMaster && !finalChurchId) {
            logInteraction('Alert: Church required (non-master)');
            alert(t('common.selectChurch'));
            return;
        }
        setIsModalOpen(true);
    };

    const handleDeleteMeeting = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta reunión?')) return;

        setIsSubmitting(true);
        try {
            const response = await api.delete(`/calendar/${id}`, {
                params: { churchId: finalChurchId }
            });
            if (response.data.success) {
                alert('Reunión eliminada');
                fetchInstances();
                setSelectedInstanceId(null);
            } else {
                alert(response.data.message || 'Error al eliminar');
            }
        } catch (err) {
            console.error('Error deleting meeting:', err);
            alert('Error de conexión');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (isoStr: string) => {
        const date = new Date(isoStr);
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const filteredMeetings = instances.filter(inst => {
        const matchesSearch = inst.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            (inst.category?.toLowerCase().includes(filters.search.toLowerCase()));
        const matchesType = filters.type === 'all' || inst.meeting_type === filters.type;
        const matchesCategory = filters.category === 'all' || inst.category === filters.category;

        // Date filters (string comparison for YYYY-MM-DD is safe and efficient)
        // If it's a recurrent master record (instance_date is null), we match if any of the other filters match
        const isRecurrentMaster = !inst.instance_date && inst.meeting_type === 'recurrent';

        const matchesDateFrom = isRecurrentMaster || !filters.dateFrom || inst.instance_date! >= filters.dateFrom;
        const matchesDateTo = isRecurrentMaster || !filters.dateTo || inst.instance_date! <= filters.dateTo;

        return matchesSearch && matchesType && matchesCategory && matchesDateFrom && matchesDateTo;
    });

    const renderMeetingCard = (instance: MeetingInstance, mode: 'list' | 'grid') => (
        <Card key={`${instance.id}-${instance.instance_date}`} style={{
            padding: '20px',
            display: 'flex',
            flexDirection: mode === 'grid' ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: mode === 'grid' ? 'flex-start' : 'center',
            gap: mode === 'grid' ? '16px' : '0'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: mode === 'grid' ? '100%' : 'auto' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    minWidth: '60px',
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
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 className="text-h3" style={{ margin: 0, fontSize: mode === 'grid' ? '16px' : '18px' }}>{instance.title}</h3>
                        {shouldShowTag(instance) && (
                            <span style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '20px',
                                backgroundColor: `${getCategoryColor(instance.category!)}15`,
                                color: getCategoryColor(instance.category!),
                                fontWeight: '600',
                                border: `1px solid ${getCategoryColor(instance.category!)}30`
                            }}>
                                {instance.category}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
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
                    </div>
                </div>
            </div>

            <div style={{
                display: 'flex',
                gap: mode === 'grid' ? '12px' : '24px',
                alignItems: 'center',
                width: mode === 'grid' ? '100%' : 'auto',
                justifyContent: mode === 'grid' ? 'space-between' : 'flex-end',
                marginTop: mode === 'grid' ? '8px' : '0'
            }}>
                <div style={{ textAlign: mode === 'grid' ? 'left' : 'center' }}>
                    <span className={`status-badge ${instance.meeting_type === 'recurrent' ? 'status-active' : 'status-pending'}`} style={{ fontSize: '9px', marginBottom: '4px', display: 'inline-block' }}>
                        {instance.meeting_type === 'recurrent' ? t('reunions.status.recurrent') : t('reunions.status.special')}
                    </span>
                    {mode === 'list' && (
                        <p className="text-body" style={{ fontSize: '12px', margin: 0, color: '#9CA3AF' }}>{t('reunions.assignedMembers', { count: instance.team_count })}</p>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(isMaster || isPastor) && (
                        <>
                            <Button
                                variant="secondary"
                                icon="delete"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMeeting(instance.id);
                                }}
                                style={{ color: 'var(--color-danger-red)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                disabled={isSubmitting}
                            />
                            <Button
                                variant="secondary"
                                icon="edit"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    logInteraction('Click Edit Meeting', { instanceId: instance.id });
                                    setSelectedInstanceId(instance.id);
                                    // In a real scenario, we might want to open the form in edit mode
                                    // But for now setSelectedInstanceId opens the DetailView which 
                                    // should have edit capabilities or we can trigger the Modal
                                }}
                            />
                        </>
                    )}
                    <Button variant="secondary" icon="chevron_right" onClick={() => {
                        logInteraction('Click View Instance Details', { instanceId: instance.id });
                        setSelectedInstanceId(instance.id);
                    }} />
                </div>
            </div>
        </Card>
    );

    return (
        <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
            {/* Main Tabs - Scrollable on Mobile */}
            <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '24px',
                borderBottom: '1px solid var(--color-border-subtle)',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                scrollbarWidth: 'none', // For Firefox
                msOverflowStyle: 'none' // For IE/Edge
            }} className="no-scrollbar">
                <style>{`
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                <button
                    onClick={() => setActiveTab('calendar')}
                    style={{
                        padding: '12px 20px',
                        border: 'none',
                        borderBottom: activeTab === 'calendar' ? '3px solid var(--color-brand-blue)' : '3px solid transparent',
                        backgroundColor: 'transparent',
                        color: activeTab === 'calendar' ? 'var(--color-brand-blue)' : 'var(--color-ui-text-soft)',
                        fontWeight: activeTab === 'calendar' ? '700' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '14px',
                        flexShrink: 0
                    }}
                >
                    {t('nav.calendar')}
                </button>
                <button
                    onClick={() => setActiveTab('meetings')}
                    style={{
                        padding: '12px 20px',
                        border: 'none',
                        borderBottom: activeTab === 'meetings' ? '3px solid var(--color-brand-blue)' : '3px solid transparent',
                        backgroundColor: 'transparent',
                        color: activeTab === 'meetings' ? 'var(--color-brand-blue)' : 'var(--color-ui-text-soft)',
                        fontWeight: activeTab === 'meetings' ? '700' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '14px',
                        flexShrink: 0
                    }}
                >
                    {t('nav.reunions')}
                </button>
            </div>

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', flex: '1 1 auto' }}>
                    <h1 className="text-h1" style={{ margin: 0 }}>{activeTab === 'calendar' ? t('nav.calendar') : t('nav.reunions')}</h1>

                    {activeTab === 'meetings' && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {/* View Switcher for Reuniones tab */}
                            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '12px', display: 'flex', gap: '2px', border: '1px solid var(--color-border-subtle)' }}>
                                <button
                                    onClick={() => setMeetingsViewMode('grid')}
                                    style={{
                                        padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                        backgroundColor: meetingsViewMode === 'grid' ? 'var(--color-brand-blue)' : 'transparent',
                                        color: meetingsViewMode === 'grid' ? 'white' : 'var(--color-ui-text-soft)',
                                        display: 'flex', alignItems: 'center', transition: 'all 0.2s'
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>grid_view</span>
                                </button>
                                <button
                                    onClick={() => setMeetingsViewMode('list')}
                                    style={{
                                        padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                        backgroundColor: meetingsViewMode === 'list' ? 'var(--color-brand-blue)' : 'transparent',
                                        color: meetingsViewMode === 'list' ? 'white' : 'var(--color-ui-text-soft)',
                                        display: 'flex', alignItems: 'center', transition: 'all 0.2s'
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>list</span>
                                </button>
                            </div>

                            {canManageMeetings && (
                                <Button
                                    label={t('reunions.newMeeting')}
                                    icon="add"
                                    onClick={handleNewMeeting}
                                    className="compact-mobile"
                                    style={{ height: '32px', padding: '0 12px' }}
                                />
                            )}
                        </div>
                    )}
                </div>
                <p className="text-body" style={{ color: '#9CA3AF', margin: 0, width: '100%', fontSize: '14px' }}>
                    {activeTab === 'calendar' ? t('reunions.description') : 'Busca y filtra todas las reuniones creadas.'}
                </p>
                <style>{`
                    @media (max-width: 600px) {
                        .compact-mobile span:not(.material-symbols-outlined) {
                            display: none;
                        }
                        .compact-mobile {
                            padding: 0 !important;
                            width: 32px !important;
                            min-width: 32px !important;
                            border-radius: 50% !important;
                        }
                    }
                `}</style>
            </header>

            {/* Content Area */}
            {isLoading ? (
                <div className="flex-center" style={{ height: '300px' }}>
                    <div className="spinner" />
                </div>
            ) : activeTab === 'calendar' ? (
                <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                    {/* Monthly Navigation for Calendar Tab */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 className="text-h2" style={{ textTransform: 'capitalize' }}>
                            {currentDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
                        </h2>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button variant="secondary" icon="chevron_left" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} />
                            <Button variant="secondary" label={t('reunions.today')} onClick={() => setCurrentDate(new Date())} />
                            <Button variant="secondary" icon="chevron_right" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} />
                        </div>
                    </div>

                    <Card style={{ padding: '0', overflow: 'hidden' }}>
                        {/* Weekday Headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                            {(() => {
                                const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
                                return weekDays.map(day => (
                                    <div key={day} style={{ padding: '12px', textAlign: 'center' }}>
                                        <span className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>{day}</span>
                                    </div>
                                ));
                            })()}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                            {(() => {
                                const year = currentDate.getFullYear();
                                const month = currentDate.getMonth();
                                const firstDayStr = new Date(year, month, 1).getDay();
                                const firstDayIndex = (firstDayStr + 6) % 7;
                                const lastDay = new Date(year, month + 1, 0).getDate();
                                const prevLastDay = new Date(year, month, 0).getDate();

                                const cells = [];
                                for (let i = firstDayIndex - 1; i >= 0; i--) cells.push({ d: prevLastDay - i, cur: false, m: -1 });
                                for (let i = 1; i <= lastDay; i++) cells.push({ d: i, cur: true, m: 0 });
                                const nextPadding = (7 - (cells.length % 7)) % 7;
                                for (let i = 1; i <= nextPadding; i++) cells.push({ d: i, cur: false, m: 1 });

                                return cells.map((cell, idx) => {
                                    const dateObj = new Date(year, month + cell.m, cell.d);
                                    const dStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
                                    const dayEvents = instances.filter(inst => inst.instance_date === dStr);
                                    const isToday = dStr === new Date().toISOString().split('T')[0];
                                    const hasEvents = dayEvents.length > 0;

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                if (hasEvents) {
                                                    logInteraction('Click Day Cell', { date: dStr, count: dayEvents.length });
                                                    setSelectedDay(dStr);
                                                }
                                            }}
                                            style={{
                                                minHeight: '110px', padding: '8px',
                                                borderRight: idx % 7 === 6 ? 'none' : '1px solid var(--color-border-subtle)',
                                                borderBottom: '1px solid var(--color-border-subtle)',
                                                backgroundColor: !cell.cur ? 'rgba(255, 255, 255, 0.02)' : (hasEvents ? 'rgba(61, 104, 223, 0.08)' : 'transparent'),
                                                cursor: hasEvents ? 'pointer' : 'default',
                                                transition: 'all 0.2s',
                                                position: 'relative'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (hasEvents) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(61, 104, 223, 0.15)';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (hasEvents) (e.currentTarget as HTMLElement).style.backgroundColor = cell.cur ? 'rgba(61, 104, 223, 0.08)' : 'rgba(255, 255, 255, 0.02)';
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                                <span style={{
                                                    fontSize: '12px', fontWeight: isToday ? '700' : '500', opacity: cell.cur ? 1 : 0.4,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%',
                                                    backgroundColor: isToday ? 'var(--color-brand-blue)' : 'transparent',
                                                    color: isToday ? 'white' : 'inherit'
                                                }}>{cell.d}</span>

                                                {/* Dots/Lines indicators for meeting count */}
                                                {hasEvents && (
                                                    <div style={{ display: 'flex', gap: '2px' }}>
                                                        {dayEvents.slice(0, 3).map((_, i) => (
                                                            <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-brand-blue)' }} />
                                                        ))}
                                                        {dayEvents.length > 3 && (
                                                            <span style={{ fontSize: '8px', color: 'var(--color-brand-blue)', fontWeight: 'bold' }}>+</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                {dayEvents.slice(0, 2).map(ev => (
                                                    <div key={ev.id} style={{
                                                        fontSize: '9px', padding: '2px 4px', borderRadius: '4px',
                                                        backgroundColor: ev.category ? `${getCategoryColor(ev.category)}15` : 'rgba(59, 130, 246, 0.1)',
                                                        color: ev.category ? getCategoryColor(ev.category) : '#3B82F6',
                                                        borderLeft: `2px solid ${ev.category ? getCategoryColor(ev.category) : '#3B82F6'}`,
                                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                                    }}>
                                                        <b>{formatTime(ev.start_datetime_utc)}</b> {ev.title}
                                                    </div>
                                                ))}
                                                {dayEvents.length > 2 && (
                                                    <div style={{ fontSize: '9px', color: 'var(--color-ui-text-soft)', textAlign: 'center', fontStyle: 'italic' }}>
                                                        {t('common.more', { count: dayEvents.length - 2 })}...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </Card>
                </div>
            ) : (
                <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                    {/* Reuniones Tab - Search and Filters Top Bar */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
                            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>search</span>
                            <input
                                type="text"
                                placeholder="Buscar reuniones, tags..."
                                className="w-full"
                                value={filters.search}
                                onChange={e => setFilters({ ...filters, search: e.target.value })}
                                style={{ padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid var(--color-border-subtle)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
                            />
                        </div>

                        <Button
                            variant="secondary"
                            icon="tune"
                            label="Filtros"
                            onClick={() => setShowFilters(!showFilters)}
                            style={{ backgroundColor: showFilters ? 'rgba(61, 104, 223, 0.1)' : 'transparent', borderColor: showFilters ? 'var(--color-brand-blue)' : 'var(--color-border-subtle)' }}
                        />

                    </div>

                    {/* Advanced Filters Panel */}
                    {showFilters && (
                        <Card style={{ padding: '20px', marginBottom: '20px', border: '1px solid var(--color-border-subtle)', animation: 'slideDown 0.2s ease-out' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                <div>
                                    <label className="text-overline" style={{ display: 'block', marginBottom: '8px' }}>Tipo de Reunión</label>
                                    <select className="w-full" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)', backgroundColor: 'transparent', color: 'white' }}>
                                        <option value="all">{t('reunions.allTypes')}</option>
                                        <option value="recurrent">{t('reunions.status.recurrent')}</option>
                                        <option value="special">{t('reunions.status.special')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-overline" style={{ display: 'block', marginBottom: '8px' }}>Categoría / Tag</label>
                                    <select className="w-full" value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)', backgroundColor: 'transparent', color: 'white' }}>
                                        <option value="all">{t('reunions.allCategories')}</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ gridColumn: 'span 1' }}>
                                    <label className="text-overline" style={{ display: 'block', marginBottom: '8px' }}>{t('reunions.dateRange')}</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <input
                                            type="date"
                                            className="w-full shadow-sm"
                                            value={filters.dateFrom}
                                            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
                                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)', backgroundColor: 'transparent', color: 'white', flex: '1 1 120px', minWidth: '130px' }}
                                        />
                                        <span className="desktop-only">-</span>
                                        <input
                                            type="date"
                                            className="w-full shadow-sm"
                                            value={filters.dateTo}
                                            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
                                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)', backgroundColor: 'transparent', color: 'white', flex: '1 1 120px', minWidth: '130px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                <Button variant="ghost" label="Limpiar Filtros" onClick={() => setFilters({ search: '', type: 'all', category: 'all', dateFrom: '', dateTo: '' })} />
                            </div>
                        </Card>
                    )}

                    {/* Meetings List/Grid Content */}
                    <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                        {meetingsViewMode === 'grid' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                                {filteredMeetings.map(inst => renderMeetingCard(inst, 'grid'))}
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '8px' }}>
                                {filteredMeetings.map(inst => renderMeetingCard(inst, 'list'))}
                            </div>
                        )}

                        {filteredMeetings.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px' }}>event_busy</span>
                                <p>{t('reunions.noMeetings')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('reunions.newMeeting')}>
                <MeetingForm initialChurchId={finalChurchId} onSuccess={() => { setIsModalOpen(false); fetchInstances(); }} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            <Modal isOpen={!!selectedInstanceId} onClose={() => setSelectedInstanceId(null)} title={t('reunions.details')}>
                {selectedInstanceId && <MeetingDetailView instanceId={selectedInstanceId} onClose={() => setSelectedInstanceId(null)} />}
            </Modal>

            {/* Day Expansion Modal */}
            <Modal
                isOpen={!!selectedDay}
                onClose={() => setSelectedDay(null)}
                title={selectedDay ? new Date(selectedDay + 'T00:00:00').toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedDay && instances.filter(inst => inst.instance_date === selectedDay).map(inst => (
                        <div key={inst.id} onClick={() => {
                            setSelectedInstanceId(inst.id);
                            setSelectedDay(null);
                        }} style={{ cursor: 'pointer' }}>
                            {renderMeetingCard(inst, 'list')}
                        </div>
                    ))}
                    {selectedDay && instances.filter(inst => inst.instance_date === selectedDay).length === 0 && (
                        <p style={{ textAlign: 'center', padding: '20px', opacity: 0.6 }}>No hay reuniones para este día.</p>
                    )}
                    <Button variant="secondary" label={t('common.close')} onClick={() => setSelectedDay(null)} />
                </div>
            </Modal>
        </div>
    );
};



