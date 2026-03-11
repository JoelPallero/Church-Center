import { useState, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import api from '../../services/api';
import { AssignmentForm } from './AssignmentForm';
import { SetlistAssignmentForm } from './SetlistAssignmentForm';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

interface MeetingDetailViewProps {
    instanceId: number;
    onClose: () => void;
    onEdit?: (details: any) => void;
    onDelete?: (id: number) => void;
}

export const MeetingDetailView: FC<MeetingDetailViewProps> = ({ instanceId, onClose, onEdit, onDelete }) => {
    const navigate = useNavigate();
    const { isMaster, user, hasRole } = useAuth();
    const { addToast } = useToast();
    const [details, setDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [assignmentData, setAssignmentData] = useState<any>(null);
    const [activeModal, setActiveModal] = useState<'none' | 'team' | 'setlist'>('none');

    const handleShare = () => {
        // Now accurately deep links to this meeting
        const shareUrl = `${window.location.origin}/worship/calendar?church_id=${details.church_id}&meeting_id=${instanceId}`;
        navigator.clipboard.writeText(shareUrl);
        addToast('Enlace de reunión copiado al portapapeles', 'success');
    };

    const isPastor = user?.role?.name === 'pastor' || hasRole('pastor');
    const isLeader = user?.role?.name === 'leader' || hasRole('leader');
    const canManageMeetings = isMaster || isPastor || isLeader;

    useEffect(() => {
        fetchDetails();
        if (canManageMeetings) {
            fetchAssignmentData();
        }
    }, [instanceId, canManageMeetings]);

    const fetchAssignmentData = async () => {
        try {
            const response = await api.get('/calendar/assignment-data');
            if (response.data.success) {
                setAssignmentData(response.data);
            }
        } catch (err) {
            console.error('Error fetching assignment data:', err);
        }
    };

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/calendar/${instanceId}`);
            if (response.data.success) {
                setDetails(response.data.details);
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
                            {details.meeting_type === 'recurrent'
                                ? `Recurrente - Cada ${['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][details.day_of_week] || 'semana'}`
                                : (details.instance_date && !isNaN(new Date(details.instance_date).getTime())
                                    ? new Date(details.instance_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                                    : 'Recurrente')}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <h2 className="text-h2" style={{ margin: '4px 0' }}>{details.title}</h2>
                            {details.category && (
                                <span style={{
                                    fontSize: '12px',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                    color: '#3B82F6',
                                    fontWeight: '600',
                                    border: '1px solid rgba(59, 130, 246, 0.3)'
                                }}>
                                    {details.category}
                                </span>
                            )}
                        </div>
                        <p className="text-body" style={{ color: '#6B7280' }}>
                            {details.meeting_type === 'recurrent'
                                ? `${details.start_time?.substring(0, 5) || ''} - ${details.end_time?.substring(0, 5) || ''}`
                                : (details.start_datetime_utc && !isNaN(new Date(details.start_datetime_utc).getTime())
                                    ? `${new Date(details.start_datetime_utc).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${new Date(details.end_datetime_utc).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false })}`
                                    : (details.start_time ? `${details.start_time?.substring(0, 5) || ''} - ${details.end_time?.substring(0, 5) || ''}` : ''))}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                            variant="secondary"
                            icon="ios_share"
                            onClick={handleShare}
                            style={{ padding: '8px' }}
                            title="Compartir"
                        />
                        {(isMaster || isPastor) && (
                            <>
                                <Button
                                    variant="secondary"
                                    icon="edit"
                                    onClick={() => onEdit?.(details)}
                                    style={{ padding: '8px' }}
                                />
                                <Button
                                    variant="secondary"
                                    icon="delete"
                                    disabled={isDeleting}
                                    onClick={async () => {
                                        if (window.confirm('¿Estás seguro de que deseas eliminar esta reunión?')) {
                                            setIsDeleting(true);
                                            try {
                                                const response = await api.delete(`/calendar/${instanceId}`);
                                                if (response.data.success) {
                                                    onDelete?.(instanceId);
                                                }
                                            } catch (err) {
                                                console.error('Error deleting:', err);
                                            } finally {
                                                setIsDeleting(false);
                                            }
                                        }
                                    }}
                                    style={{ padding: '8px', color: 'var(--color-danger-red)' }}
                                />
                            </>
                        )}
                    </div>
                </div>
                {details.description && (
                    <div style={{ marginTop: '16px' }}>
                        <h5 className="text-overline" style={{ fontSize: '10px', marginBottom: '4px' }}>CRONOGRAMA / NOTAS</h5>
                        <p className="text-body" style={{ fontSize: '14px', fontStyle: 'italic', margin: 0 }}>
                            {details.description}
                        </p>
                    </div>
                )}

                {(() => {
                    const preacher = details.team.find((m: any) =>
                        m.role?.toLowerCase().includes('pastor') ||
                        m.role?.toLowerCase().includes('predicador')
                    );
                    if (preacher) {
                        return (
                            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)' }}>record_voice_over</span>
                                <div>
                                    <p className="text-overline" style={{ margin: 0, opacity: 0.6 }}>PASTOR / PREDICADOR</p>
                                    <p className="text-body" style={{ fontWeight: 'bold', margin: 0 }}>{preacher.member_name}</p>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <section>
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h4 className="text-overline">EQUIPO ASIGNADO</h4>
                        {canManageMeetings && (
                            <Button variant="ghost" icon="person_add" style={{ padding: '4px' }} onClick={() => setActiveModal('team')} />
                        )}
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
                        {canManageMeetings && (
                            <Button variant="ghost" icon="playlist_add" style={{ padding: '4px' }} onClick={() => setActiveModal('setlist')} />
                        )}
                    </header>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {details.setlists.length > 0 ? details.setlists.map((sl: any) => (
                            <div 
                                key={sl.id} 
                                onClick={() => navigate(`/worship/playlists/${sl.playlist_id}`)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    border: '1px solid rgba(59, 130, 246, 0.1)'
                                }}
                                className="list-item-hover"
                            >
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-brand-blue)' }}>queue_music</span>
                                <div style={{ flex: 1 }}>
                                    <p className="text-body" style={{ fontWeight: 600, margin: 0 }}>{sl.playlist_name}</p>
                                    <p className="text-overline" style={{ color: 'gray' }}>Asignado por {sl.assigned_by_name || 'Líder'}</p>
                                </div>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', opacity: 0.5 }}>navigate_next</span>
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

