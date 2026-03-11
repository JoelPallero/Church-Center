import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useTutorials } from '../../../context/TutorialContext';
import { Modal } from '../../../components/ui/Modal';
import { MeetingForm } from '../../../components/reunions/MeetingForm';
import { MeetingDetailView } from '../../../components/reunions/MeetingDetailView';
import api from '../../../services/api';

// FullCalendar Imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

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
    day_of_week?: number;
    start_time?: string;
    end_time?: string;
}

export const CalendarPage: FC = () => {
    const { t, i18n } = useTranslation();
    const [searchParams] = useSearchParams();
    const { isMaster, user, hasRole } = useAuth();
    const { startTutorial, showTutorials } = useTutorials();
    const [instances, setInstances] = useState<MeetingInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(() => {
        const idParam = searchParams.get('meeting_id');
        return idParam ? parseInt(idParam) : null;
    });
    const [editingMeeting, setEditingMeeting] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'calendar' | 'meetings'>('calendar');
    const [meetingsViewMode] = useState<'list' | 'grid'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [dayMeetings, setDayMeetings] = useState<MeetingInstance[]>([]);
    const [churches, setChurches] = useState<any[]>([]);
    const [selectedChurchId, setSelectedChurchId] = useState<number | null>(null);



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
    const finalChurchId = selectedChurchId || churchId || user?.churchId;
    const canManageMeetings = isMaster || isPastor || isLeader;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const categories = [
        "Reuniones ocasionales",
        "Cambios de horario",
        "Reuniones especiales",
        "Reuniones de equipos",
        "Ensayos",
        "Reuniones que no cambian",
        "Reunión de jóvenes",
        "Reunión de adolescentes",
        "Reunión de preadolescentes",
        "Reunión de mujeres",
        "Reunión de hombres",
        "Evento",
        "Congreso",
        "Taller"
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
            'Reuniones ocasionales': '#FCD34D',
            'Reuniones especiales': '#FB923C',
            'Reuniones de equipos': '#4F46E5',
            'Equipo': '#4F46E5'
        };
        if (!colors[category]) {
            let hash = 0;
            for (let i = 0; i < category.length; i++) hash = category.charCodeAt(i) + ((hash << 5) - hash);
            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
            return "#" + "00000".substring(0, 6 - c.length) + c;
        }
        return colors[category];
    };

    useEffect(() => {
        if (finalChurchId) fetchInstances();
        else setIsLoading(false);
    }, [finalChurchId, activeTab]);

    useEffect(() => {
        const idParam = searchParams.get('meeting_id');
        if (idParam) {
            setSelectedInstanceId(parseInt(idParam));
        }
    }, [searchParams]);

    useEffect(() => {
        if (isMaster) {
            fetchChurches();
        }
    }, [isMaster]);

    useEffect(() => {
        if (showTutorials && !isLoading && instances.length >= 0) {
            const hasSeenTutorial = localStorage.getItem('tutorial_seen_meetings');
            if (!hasSeenTutorial) {
                if (window.confirm('¿Quieres realizar un breve recorrido por la gestión de reuniones?')) {
                    startTutorial('meetings');
                }
                localStorage.setItem('tutorial_seen_meetings', 'true');
            }
        }
    }, [showTutorials, isLoading]);

    const fetchChurches = async () => {
        try {
            const response = await api.get('/churches', {
                params: { action: 'my_churches' }
            });
            if (response.data.success) {
                setChurches(response.data.churches);
                // If we don't have a selection yet, set it to the current user's church or first in list
                if (!selectedChurchId) {
                    const initialId = churchId || user?.churchId || response.data.churches[0]?.id;
                    setSelectedChurchId(initialId);
                }
            }
        } catch (err) {
            console.error('Error fetching churches:', err);
        }
    };

    const fetchInstances = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/calendar/events', { params: { church_id: finalChurchId } });
            if (response.data.success) {
                setInstances(response.data.instances || []);
            }
        } catch (err) {
            console.error('Error fetching calendar:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Transform instances for FullCalendar
    const fcEvents = useMemo(() => {
        const expanded: any[] = [];
        instances.forEach(inst => {
            if (inst.meeting_type === 'recurrent') {
                expanded.push({
                    id: inst.id.toString(),
                    title: inst.title,
                    daysOfWeek: [inst.day_of_week === 7 ? 0 : inst.day_of_week], // 0 is Sunday in FC
                    startTime: inst.start_time,
                    endTime: inst.end_time,
                    backgroundColor: getCategoryColor(inst.category || ''),
                    borderColor: 'transparent',
                    extendedProps: { ...inst }
                });
            } else {
                expanded.push({
                    id: inst.id.toString(),
                    title: inst.title,
                    start: inst.start_datetime_utc,
                    end: inst.end_datetime_utc,
                    backgroundColor: getCategoryColor(inst.category || ''),
                    borderColor: 'transparent',
                    extendedProps: { ...inst }
                });
            }
        });
        return expanded;
    }, [instances]);

    const handleEventClick = (info: any) => {
        if (info.event.url) return;
        setSelectedInstanceId(parseInt(info.event.id));
    };

    const handleDateClick = (arg: any) => {
        const year = arg.date.getFullYear();
        const month = String(arg.date.getMonth() + 1).padStart(2, '0');
        const day = String(arg.date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const dayOfWeek = arg.date.getDay();

        const meetings = instances.filter(i =>
            (i.instance_date === dateStr) ||
            (i.meeting_type === 'recurrent' && (i.day_of_week === dayOfWeek || (i.day_of_week === 7 && dayOfWeek === 0)))
        );

        const formattedDate = arg.date.toLocaleDateString(i18n.language, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        setSelectedDate(`${formattedDate.charAt(0).toUpperCase()}${formattedDate.slice(1)}`);
        setDayMeetings(meetings);
    };

    const handleDeleteMeeting = async (id: number) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta reunión?')) return;
        setIsSubmitting(true);
        try {
            const response = await api.delete(`/calendar/${id}`, { params: { churchId: finalChurchId } });
            if (response.data.success) {
                fetchInstances();
                setSelectedInstanceId(null);
            }
        } catch (err) {
            console.error('Error deleting meeting:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (isoStr: string) => {
        if (!isoStr || isoStr.startsWith('0000')) return '';
        const date = new Date(isoStr);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const filteredMeetings = instances.filter(inst => {
        const matchesSearch = inst.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            inst.category?.toLowerCase().includes(filters.search.toLowerCase());
        const matchesType = filters.type === 'all' || inst.meeting_type === filters.type;
        const matchesCategory = filters.category === 'all' || inst.category === filters.category;
        return matchesSearch && matchesType && matchesCategory;
    });

    const renderMeetingCard = (instance: MeetingInstance, _mode: 'list' | 'grid') => (
        <Card key={`${instance.id}-${instance.instance_date}`} style={{
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            minHeight: '74px'
        }} onClick={() => setSelectedInstanceId(instance.id)}>
            <div style={{
                width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--color-brand-blue)', textTransform: 'uppercase' }}>
                    {instance.instance_date && !isNaN(new Date(instance.instance_date).getTime())
                        ? new Date(instance.instance_date).toLocaleDateString(i18n.language, { month: 'short' })
                        : 'Rec'}
                </span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--color-brand-blue)', lineHeight: 1 }}>
                    {instance.instance_date && !isNaN(new Date(instance.instance_date).getTime())
                        ? new Date(instance.instance_date).getDate()
                        : '∞'}
                </span>
            </div>
            
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <h3 className="text-h3" style={{ 
                        margin: 0, 
                        fontSize: '15px', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                    }}>{instance.title}</h3>
                    
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {(isMaster || isPastor) && (
                            <Button 
                                variant="ghost" 
                                icon="delete" 
                                disabled={isSubmitting} 
                                onClick={(e) => { e.stopPropagation(); handleDeleteMeeting(instance.id); }} 
                                style={{ color: 'var(--color-danger-red)', padding: '4px', height: '32px', width: '32px' }} 
                            />
                        )}
                        <Button 
                            variant="ghost" 
                            icon="visibility" 
                            onClick={(e) => { e.stopPropagation(); setSelectedInstanceId(instance.id); }} 
                            style={{ padding: '4px', height: '32px', width: '32px' }} 
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {instance.category && (
                        <span style={{
                            fontSize: '9px', padding: '1px 6px', borderRadius: '4px',
                            backgroundColor: `${getCategoryColor(instance.category)}15`,
                            color: getCategoryColor(instance.category), fontWeight: '700', border: `1px solid ${getCategoryColor(instance.category)}30`
                        }}>
                            {instance.category}
                        </span>
                    )}
                    <span className="text-body-secondary" style={{ fontSize: '11px', fontWeight: 500, opacity: 0.8 }}>
                        {instance.start_time || (instance.start_datetime_utc && formatTime(instance.start_datetime_utc))}
                    </span>
                </div>
            </div>
        </Card>
    );

    return (
        <div style={{ position: 'relative', width: '100%', minWidth: 0, paddingBottom: '100px' }}>
            <style>{`
                .fc { --fc-border-color: var(--color-border-subtle); --fc-button-bg-color: transparent; --fc-button-border-color: var(--color-border-subtle); --fc-button-text-color: var(--color-ui-text); --fc-button-active-bg-color: var(--color-brand-blue); --fc-button-active-border-color: var(--color-brand-blue); font-family: inherit; }
                .fc .fc-toolbar-title { font-size: 1.25rem; font-weight: 700; text-transform: capitalize; }
                .fc .fc-button { font-weight: 600; text-transform: capitalize; border-radius: 10px; }
                .fc .fc-button-primary:not(:disabled):active, .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: var(--color-brand-blue); color: white; }
                .fc .fc-daygrid-day.fc-day-today { background-color: rgba(59, 130, 246, 0.05); }
                .fc-theme-standard td, .fc-theme-standard th { border: 1px solid var(--color-border-subtle); }
                .fc .fc-col-header-cell { background-color: var(--color-ui-surface); padding: 8px 0 !important; }
                .fc .fc-col-header-cell-cushion { color: var(--color-ui-text-soft); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
                .fc .fc-daygrid-day-number { font-size: 0.85rem; font-weight: 600; padding: 8px; color: var(--color-ui-text); }
                .mobile-count { background: var(--color-brand-blue); color: white; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; margin-left: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .fc-event { border-radius: 6px; padding: 2px 4px; font-size: 0.75rem; cursor: pointer; transition: transform 0.1s; border: none !important; }
                .fc-event:hover { transform: scale(1.02); filter: brightness(1.1); }
                .fc-daygrid-event-harness { margin-top: 2px !important; }
            `}</style>

            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--color-border-subtle)' }}>
                {['calendar', 'meetings'].map(tab => (
                    <button key={tab} id={tab === 'meetings' ? 'tab-meetings' : undefined} onClick={() => setActiveTab(tab as any)} style={{
                        padding: '12px 20px', border: 'none', borderBottom: activeTab === tab ? '3px solid var(--color-brand-blue)' : '3px solid transparent',
                        backgroundColor: 'transparent', color: activeTab === tab ? 'var(--color-brand-blue)' : 'var(--color-ui-text-soft)',
                        fontWeight: activeTab === tab ? '700' : '500', cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px'
                    }}>
                        {t(`nav.${tab === 'calendar' ? 'calendar' : 'reunions'}`)}
                    </button>
                ))}
            </div>

            <header style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                marginBottom: '32px',
                gap: '16px'
            }}>
                <div id="calendar-header">
                    <h1 className="text-h1" style={{ margin: 0, fontSize: isMobile ? '24px' : '32px' }}>
                        {activeTab === 'calendar' ? t('nav.calendar') : t('nav.reunions')}
                    </h1>
                    <p className="text-body-secondary" style={{ margin: '4px 0 0' }}>
                        {activeTab === 'calendar' ? t('reunions.description') : 'Busca y filtra todas las reuniones.'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto', flexDirection: isMobile ? 'column' : 'row' }}>
                    {isMaster && (
                        <select
                            value={selectedChurchId || ''}
                            onChange={(e) => setSelectedChurchId(parseInt(e.target.value))}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border-subtle)',
                                backgroundColor: 'var(--color-ui-surface)',
                                color: 'var(--color-ui-text)',
                                fontSize: '14px',
                                fontWeight: '500',
                                minWidth: '200px'
                            }}
                        >
                            <option value="">{t('common.selectChurch')}</option>
                            {churches.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}
                    {canManageMeetings && (
                        <div id="btn-new-meeting">
                            <Button
                                label={t('reunions.newMeeting')}
                                icon="add"
                                onClick={() => setIsModalOpen(true)}
                                style={{ width: '100%' }}
                            />
                        </div>
                    )}
                </div>
            </header>

            {isLoading ? (
                <div className="flex-center" style={{ height: '300px' }}><div className="spinner" /></div>
            ) : activeTab === 'calendar' ? (
                <div style={{ animation: 'fadeIn 0.2s ease-out' }}>

                    <Card style={{ padding: '24px' }}>
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            locale={esLocale}
                            events={fcEvents}
                            eventClick={handleEventClick}
                            dateClick={handleDateClick}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,dayGridWeek'
                            }}
                            dayCellContent={(arg) => {
                                // Use local date components to avoid timezone shifts
                                const year = arg.date.getFullYear();
                                const month = String(arg.date.getMonth() + 1).padStart(2, '0');
                                const day = String(arg.date.getDate()).padStart(2, '0');
                                const dateStr = `${year}-${month}-${day}`;

                                const count = instances.filter(i => (i.instance_date === dateStr) ||
                                    (i.meeting_type === 'recurrent' && (i.day_of_week === arg.date.getDay() || (i.day_of_week === 7 && arg.date.getDay() === 0)))
                                ).length;

                                return (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 4px' }}>
                                        <span>{arg.dayNumberText}</span>
                                        {isMobile && count > 0 && <span className="mobile-count" title={`${count} reuniones`}>{count}</span>}
                                    </div>
                                );
                            }}
                            eventContent={(eventInfo) => {
                                if (isMobile) return null;
                                return (
                                    <div style={{ padding: '2px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        <b>{eventInfo.timeText}</b> {eventInfo.event.title}
                                    </div>
                                );
                            }}
                            height="auto"
                        />
                    </Card>
                </div>
            ) : (
                <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                        <input type="text" placeholder="Buscar..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} style={{ flex: 1 }} />
                        <Button icon={showFilters ? 'expand_less' : 'filter_list'} onClick={() => setShowFilters(!showFilters)} />
                    </div>
                    {showFilters && (
                        <Card style={{ padding: '20px', marginBottom: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
                                    <option value="all">Todos los tipos</option>
                                    <option value="recurrent">Recurrente</option>
                                    <option value="special">Especial</option>
                                </select>
                                <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
                                    <option value="all">Todas las categorías</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </Card>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: meetingsViewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : '1fr', gap: '16px' }}>
                        {filteredMeetings.map(inst => renderMeetingCard(inst, meetingsViewMode))}
                    </div>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('reunions.newMeeting')}>
                <MeetingForm initialChurchId={finalChurchId} onSuccess={() => { setIsModalOpen(false); fetchInstances(); }} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            <Modal isOpen={!!selectedInstanceId} onClose={() => setSelectedInstanceId(null)} title={t('reunions.details')}>
                {selectedInstanceId && (
                    <MeetingDetailView
                        instanceId={selectedInstanceId}
                        onClose={() => setSelectedInstanceId(null)}
                        onEdit={(details) => {
                            setSelectedInstanceId(null);
                            setEditingMeeting(details);
                        }}
                        onDelete={() => {
                            setSelectedInstanceId(null);
                            fetchInstances();
                        }}
                    />
                )}
            </Modal>

            <Modal isOpen={!!editingMeeting} onClose={() => setEditingMeeting(null)} title={t('common.edit')}>
                {editingMeeting && (
                    <MeetingForm
                        initialChurchId={finalChurchId}
                        initialData={editingMeeting}
                        onSuccess={() => { setEditingMeeting(null); fetchInstances(); }}
                        onCancel={() => setEditingMeeting(null)}
                    />
                )}
            </Modal>

            <Modal
                isOpen={!!selectedDate}
                onClose={() => setSelectedDate(null)}
                title={selectedDate || ''}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: isMobile ? '100%' : '400px' }}>
                    {dayMeetings.length > 0 ? (
                        dayMeetings.map(meeting => (
                            <Card
                                key={meeting.id}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    border: '1px solid var(--color-border-subtle)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    minHeight: '64px'
                                }}
                                onClick={() => {
                                    setSelectedDate(null);
                                    setSelectedInstanceId(meeting.id);
                                }}
                            >
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meeting.title}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{
                                            fontSize: '8px', padding: '1px 5px', borderRadius: '4px',
                                            backgroundColor: `${getCategoryColor(meeting.category || '')}15`,
                                            color: getCategoryColor(meeting.category || '')
                                        }}>
                                            {meeting.category || 'Reunión'}
                                        </span>
                                        <span className="text-body-secondary" style={{ fontSize: '10px', opacity: 0.8 }}>
                                            {meeting.start_time || formatTime(meeting.start_datetime_utc)}
                                        </span>
                                    </div>
                                </div>
                                <Button variant="ghost" icon="visibility" style={{ padding: '4px', height: '32px', width: '32px' }} />
                            </Card>
                        ))
                    ) : (
                        <div style={{ padding: '32px', textAlign: 'center' }}>
                            <p className="text-body-secondary">No hay reuniones programadas para este día.</p>
                            {canManageMeetings && (
                                <Button
                                    label="Programar una ahora"
                                    variant="primary"
                                    onClick={() => {
                                        setSelectedDate(null);
                                        setIsModalOpen(true);
                                    }}
                                    style={{ marginTop: '16px' }}
                                />
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};
