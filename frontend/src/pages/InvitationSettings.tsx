import { useState, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { invitationService } from '../services/invitationService';
import type { InvitationTemplate } from '../services/invitationService';

export const InvitationSettings: FC = () => {
    const { church, isMaster, hasRole } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [templates, setTemplates] = useState<InvitationTemplate[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Editor state
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isActive, setIsActive] = useState(false);

    const canEdit = isMaster || hasRole('pastor') || hasRole('leader') || hasRole('coordinator');

    useEffect(() => {
        if (!canEdit) {
            addToast('No tienes permisos para editar plantillas', 'error');
            navigate('/settings');
            return;
        }
        loadTemplates();
    }, [church?.id]);

    const loadTemplates = async () => {
        if (!church?.id) return;
        setIsLoading(true);
        try {
            const data = await invitationService.getTemplates(church.id);
            setTemplates(data);

            // Load selected template into editor
            const current = data.find(t => t.template_index === selectedIndex);
            if (current) {
                setSubject(current.subject);
                setBody(current.body_html);
                setIsActive(current.is_active);
            } else {
                // Default values if not found
                setSubject(`Invitación a formar parte de ${church.name}`);
                setBody('Hola {{USER_NAME}}, \n\nHas sido invitado a formar parte del equipo en {{CHURCH_NAME}}. \n\nEntra aquí para registrarte: {{INVITE_URL}}');
                setIsActive(false);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const current = templates.find(t => t.template_index === selectedIndex);
        if (current) {
            setSubject(current.subject);
            setBody(current.body_html);
            setIsActive(current.is_active);
        } else {
            setSubject(`Invitación a formar parte de ${church?.name || ''}`);
            setBody('Hola {{USER_NAME}}, \n\nHas sido invitado a formar parte del equipo en {{CHURCH_NAME}}. \n\nEntra aquí para registrarte: {{INVITE_URL}}');
            setIsActive(false);
        }
    }, [selectedIndex, templates]);

    const handleSave = async () => {
        if (!church?.id) return;
        setIsSaving(true);
        try {
            const success = await invitationService.saveTemplate({
                church_id: church.id,
                template_index: selectedIndex,
                is_active: isActive,
                subject,
                body_html: body
            });

            if (success) {
                addToast('Plantilla guardada correctamente', 'success');
                loadTemplates();
            } else {
                addToast('Error al guardar la plantilla', 'error');
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando...</div>;

    const Placeholder = ({ name }: { name: string }) => (
        <code style={{
            backgroundColor: 'var(--color-ui-bg)',
            padding: '2px 6px',
            borderRadius: '4px',
            color: 'var(--color-brand-blue)',
            fontSize: 'var(--font-size-xs)'
        }}>{`{{${name}}}`}</code>
    );

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
            <header style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Button variant="ghost" icon="arrow_back" onClick={() => navigate('/settings')} />
                <div>
                    <h1 className="text-h1">Plantillas de Invitación</h1>
                    <p className="text-body-secondary">Personaliza los correos que envías a tu equipo.</p>
                </div>
            </header>

            <section style={{ marginBottom: '32px' }}>
                <h3 className="text-overline" style={{ marginBottom: '12px' }}>Seleccionar Plantilla</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {[0, 1, 2].map(idx => {
                        const tpl = templates.find(t => t.template_index === idx);
                        const activeLabel = tpl?.is_active ? ' (En uso)' : '';
                        return (
                            <Card
                                key={idx}
                                onClick={() => setSelectedIndex(idx)}
                                style={{
                                    flex: 1,
                                    padding: '16px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    border: selectedIndex === idx ? '2px solid var(--color-brand-blue)' : '1px solid var(--color-border-subtle)',
                                    backgroundColor: selectedIndex === idx ? 'var(--color-brand-blue-transparent)' : 'var(--color-ui-card-bg)'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>drafts</span>
                                <p style={{ margin: 0, fontWeight: 600 }}>Variante {idx + 1}{activeLabel}</p>
                            </Card>
                        );
                    })}
                </div>
            </section>

            <Card style={{ padding: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Asunto del Correo</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Escribe el asunto..."
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border-subtle)',
                            backgroundColor: 'var(--color-ui-bg)',
                            color: 'var(--color-ui-text)'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Cuerpo del Mensaje (HTML compatible)</label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Escribe el contenido..."
                        style={{
                            width: '100%',
                            minHeight: '300px',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border-subtle)',
                            backgroundColor: 'var(--color-ui-bg)',
                            color: 'var(--color-ui-text)',
                            fontFamily: 'monospace'
                        }}
                    />
                </div>

                <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--color-ui-bg-soft)',
                    marginBottom: '24px',
                    border: '1px dashed var(--color-border-subtle)'
                }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Variables disponibles:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <Placeholder name="USER_NAME" />
                        <Placeholder name="CHURCH_NAME" />
                        <Placeholder name="ROLE_NAME" />
                        <Placeholder name="ROLE_LOWER" />
                        <Placeholder name="INVITE_URL" />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            style={{ width: '20px', height: '20px' }}
                        />
                        <span style={{ fontWeight: 600 }}>Usar esta versión para nuevas invitaciones</span>
                    </label>

                    <Button
                        disabled={isSaving}
                        onClick={handleSave}
                        variant="primary"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Plantilla'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
