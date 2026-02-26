import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { AssignmentForm } from './AssignmentForm';
import { SetlistAssignmentForm } from './SetlistAssignmentForm';

interface MeetingDetailViewProps {
    instanceId: number;
    onClose: () => void;
}

export const MeetingDetailView: FC<MeetingDetailViewProps> = ({ instanceId, onClose }) => {
    const [details, setDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [assignmentData, setAssignmentData] = useState<any>(null);
    const [activeModal, setActiveModal] = useState<'none' | 'team' | 'setlist'>('none');

    useEffect(() => {
        fetchDetails();
        fetchAssignmentData();
    }, [instanceId]);

    const fetchAssignmentData = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/calendar/assignment-data`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setAssignmentData(data);
            }
        } catch (err) {
            console.error('Error fetching assignment data:', err);
        }
    };

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/calendar/events/${instanceId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setDetails(data.details);
            }
        } catch (err) {
            console.error('Error fetching details:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="flex-center" style={{ height: '200px' }}><div className="spinner" /></div>;
    if (!details) return <p>No se encontraron detalles.</p>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <p className="text-overline" style={{ color: 'var(--color-brand-blue)' }}>
                            {new Date(details.instance_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <h2 className="text-h2" style={{ margin: '4px 0' }}>{details.title}</h2>
                        <p className="text-body" style={{ color: '#6B7280' }}>
                            {new Date(details.start_datetime_utc).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {new Date(details.end_datetime_utc).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
                {details.description && (
                    <p className="text-body" style={{ marginTop: '16px', fontSize: '14px', fontStyle: 'italic' }}>
                        {details.description}
                    </p>
                )}
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <section>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 className="text-overline">EQUIPO ASIGNADO</h4>
                        <Button variant="ghost" icon="person_add" style={{ padding: '4px' }} onClick={() => setActiveModal('team')} />
                    </header>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {details.team.length > 0 ? details.team.map((member: any) => (
                            <div key={member.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px',
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '12px'
                            }}>
                                <div>
                                    <p className="text-body" style={{ fontWeight: 600, margin: 0 }}>{member.member_name}</p>
                                    <p className="text-overline" style={{ color: 'gray' }}>{member.role} {member.instrument_name ? `(${member.instrument_name})` : ''}</p>
                                </div>
                                <span className={`status-badge ${member.status === 'confirmed' ? 'status-active' : (member.status === 'declined' ? 'status-danger' : 'status-pending')}`} style={{ fontSize: '10px' }}>
                                    {member.status.toUpperCase()}
                                </span>
                            </div>
                        )) : (
                            <p className="text-body" style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '12px', border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
                                No hay personal asignado todavía.
                            </p>
                        )}
                    </div>
                </section>

                <section>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 className="text-overline">SETLIST</h4>
                        <Button variant="ghost" icon="playlist_add" style={{ padding: '4px' }} onClick={() => setActiveModal('setlist')} />
                    </header>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {details.setlists.length > 0 ? details.setlists.map((sl: any) => (
                            <div key={sl.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '12px'
                            }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)' }}>queue_music</span>
                                <div style={{ flex: 1 }}>
                                    <p className="text-body" style={{ fontWeight: 600, margin: 0 }}>{sl.playlist_name}</p>
                                    <p className="text-overline" style={{ color: 'gray' }}>Asignado por {sl.assigned_by_name || 'Líder'}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-body" style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', padding: '12px', border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
                                Sin setlist seleccionada.
                            </p>
                        )}
                    </div>
                </section>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <Button label="Cerrar" variant="secondary" onClick={onClose} style={{ flex: 1 }} />
            </div>

            <Modal
                isOpen={activeModal === 'team'}
                onClose={() => setActiveModal('none')}
                title="Asignar Miembro"
            >
                {assignmentData && (
                    <AssignmentForm
                        instanceId={instanceId}
                        members={assignmentData.members}
                        instruments={assignmentData.instruments}
                        onSuccess={() => {
                            setActiveModal('none');
                            fetchDetails();
                        }}
                        onCancel={() => setActiveModal('none')}
                    />
                )}
            </Modal>

            <Modal
                isOpen={activeModal === 'setlist'}
                onClose={() => setActiveModal('none')}
                title="Vincular Setlist"
            >
                {assignmentData && (
                    <SetlistAssignmentForm
                        instanceId={instanceId}
                        playlists={assignmentData.playlists}
                        onSuccess={() => {
                            setActiveModal('none');
                            fetchDetails();
                        }}
                        onCancel={() => setActiveModal('none')}
                    />
                )}
            </Modal>
        </div>
    );
};
