import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { MeetingForm } from '../../components/reunions/MeetingForm';
import { MeetingDetailView } from '../../components/reunions/MeetingDetailView';

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
    const { t } = useTranslation();
    const [instances, setInstances] = useState<MeetingInstance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null);

    useEffect(() => {
        fetchInstances();
    }, []);

    const fetchInstances = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/calendar.php?action=list', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
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
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 className="text-h1">{t('reunions.title')}</h1>
                    <p className="text-body" style={{ color: '#9CA3AF' }}>{t('reunions.description')}</p>
                </div>
                <Button label="Nueva Reunión" icon="add" onClick={() => setIsModalOpen(true)} />
            </header>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nueva Reunión"
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
                title="Detalles de la Reunión"
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
            ) : (
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
                                        {new Date(instance.instance_date).toLocaleDateString('es-ES', { month: 'short' })}
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
                                            {instance.meeting_type === 'recurrent' ? 'RECURRENTE' : 'ESPECIAL'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p className="text-overline" style={{ color: instance.team_count > 0 ? '#10B981' : '#F59E0B' }}>
                                        {instance.team_count > 0 ? 'CON EQUIPO' : 'SIN EQUIPO'}
                                    </p>
                                    <p className="text-body" style={{ fontSize: '12px', margin: 0 }}>{instance.team_count} asignados</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p className="text-overline" style={{ color: instance.setlist_count > 0 ? '#10B981' : '#F59E0B' }}>
                                        {instance.setlist_count > 0 ? 'CON SETLIST' : 'SIN SETLIST'}
                                    </p>
                                    <p className="text-body" style={{ fontSize: '12px', margin: 0 }}>{instance.setlist_count} canciones</p>
                                </div>
                                <Button variant="secondary" icon="chevron_right" onClick={() => setSelectedInstanceId(instance.id)} />
                            </div>
                        </Card>
                    ))}

                    {instances.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px', opacity: 0.6 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>calendar_today</span>
                            <p className="text-body">No hay reuniones programadas para este período.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
