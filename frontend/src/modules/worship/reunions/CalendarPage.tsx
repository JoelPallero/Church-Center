import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
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
    const [instances, setInstances] = useState<MeetingInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'calendar' | 'meetings'>('calendar');
    const [meetingsViewMode] = useState<'list' | 'grid'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);


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
        const date = new Date(isoStr);
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const filteredMeetings = instances.filter(inst => {
        const matchesSearch = inst.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            inst.category?.toLowerCase().includes(filters.search.toLowerCase());
        const matchesType = filters.type === 'all' || inst.meeting_type === filters.type;
        const matchesCategory = filters.category === 'all' || inst.category === filters.category;
        return matchesSearch && matchesType && matchesCategory;
    });

    const renderMeetingCard = (instance: MeetingInstance, mode: 'list' | 'grid') => (
        <Card key={`${instance.id}-${instance.instance_date}`} style={{
            padding: '20px',
            display: 'flex',
            flexDirection: mode === 'grid' ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: mode === 'grid' ? 'flex-start' : 'center',
            gap: mode === 'grid' ? '16px' : '0',
            cursor: 'pointer'
        }} onClick={() => setSelectedInstanceId(instance.id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: mode === 'grid' ? '100%' : 'auto' }}>
                <div style={{
                    width: '60px', height: '60px', borderRadius: '16px', backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-brand-blue)', textTransform: 'uppercase' }}>
                        {instance.instance_date ? new Date(instance.instance_date).toLocaleDateString(i18n.language, { month: 'short' }) : 'Rec'}
                    </span>
                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-brand-blue)' }}>
                        {instance.instance_date ? new Date(instance.instance_date).getDate() : '∞'}
                    </span>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 className="text-h3" style={{ margin: 0, fontSize: mode === 'grid' ? '16px' : '18px' }}>{instance.title}</h3>
                        {instance.category && (
                            <span style={{
                                fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                                backgroundColor: `${getCategoryColor(instance.category)}15`,
                                color: getCategoryColor(instance.category), fontWeight: '600', border: `1px solid ${getCategoryColor(instance.category)}30`
                            }}>
                                {instance.category}
                            </span>
                        )}
                    </div>
                    <p className="text-body-secondary" style={{ fontSize: '12px', margin: '4px 0 0' }}>
                        {instance.start_time || (instance.start_datetime_utc && formatTime(instance.start_datetime_utc))}
                    </p>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                {(isMaster || isPastor) && (
                    <Button variant="secondary" icon="delete" disabled={isSubmitting} onClick={(e) => { e.stopPropagation(); handleDeleteMeeting(instance.id); }} style={{ color: 'var(--color-danger-red)' }} />
                )}
                <Button variant="secondary" icon="visibility" onClick={(e) => { e.stopPropagation(); setSelectedInstanceId(instance.id); }} />
            </div>
        </Card>
    );

    return (
        <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
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
                    <button key={tab} onClick={() => setActiveTab(tab as any)} style={{
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
                <div>
                    <h1 className="text-h1" style={{ margin: 0, fontSize: isMobile ? '24px' : '32px' }}>
                        {activeTab === 'calendar' ? t('nav.calendar') : t('nav.reunions')}
                    </h1>
                    <p className="text-body-secondary" style={{ margin: '4px 0 0' }}>
                        {activeTab === 'calendar' ? t('reunions.description') : 'Busca y filtra todas las reuniones.'}
                    </p>
                </div>
                {canManageMeetings && (
                    <Button
                        label={t('reunions.newMeeting')}
                        icon="add"
                        onClick={() => setIsModalOpen(true)}
                        style={{ width: isMobile ? '100%' : 'auto' }}
                    />
                )}
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
                {selectedInstanceId && <MeetingDetailView instanceId={selectedInstanceId} onClose={() => setSelectedInstanceId(null)} />}
            </Modal>
        </div>
    );
};
