import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { peopleService } from '../../../../services/peopleService';

export const InvitePerson: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [bulkEmails, setBulkEmails] = useState('');
    const [isBulk, setIsBulk] = useState(false);
    const [roleId, setRoleId] = useState(4); // Default to member
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus(null);
        try {
            if (isBulk) {
                const emailList = bulkEmails
                    .split(/[\n,]/)
                    .map(e => e.trim())
                    .filter(e => e.length > 5 && e.includes('@'));

                if (emailList.length === 0) {
                    throw new Error(t('people.invite_error_no_emails') || 'Por favor, ingresa al menos un correo válido.');
                }

                const result = await peopleService.bulkInvite(emailList);
                if (result.success > 0) {
                    setStatus({
                        type: 'success',
                        message: t('people.invite_bulk_success', { count: result.success }) + (result.failed > 0 ? ` (${result.failed} ${t('common.failed') || 'fallaron'})` : '')
                    });
                    setBulkEmails('');
                } else {
                    setStatus({ type: 'error', message: t('people.invite_bulk_error') || 'No se pudo enviar ninguna invitación.' });
                }
            } else {
                const success = await peopleService.invite(name, email, roleId);
                if (success) {
                    setStatus({ type: 'success', message: t('people.invite_success') || 'Invitación enviada correctamente.' });
                    setName('');
                    setEmail('');
                    setRoleId(4);
                } else {
                    setStatus({ type: 'error', message: t('people.invite_error') || 'Error al enviar la invitación.' });
                }
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || t('common.error_unexpected') || 'Error inesperado.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <header style={{ marginBottom: '24px' }}>
                <h1 className="text-h1">{t('people.invite')}</h1>
                <p className="text-body" style={{ color: '#6B7280' }}>{t('people.invite_description') || 'Envía una invitación por correo para unirse al equipo.'}</p>
            </header>

            <Card style={{ padding: '24px', maxWidth: '500px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: 'var(--color-ui-bg)', padding: '4px', borderRadius: '12px' }}>
                    <button
                        onClick={() => setIsBulk(false)}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: !isBulk ? '600' : '400',
                            backgroundColor: !isBulk ? 'white' : 'transparent',
                            boxShadow: !isBulk ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            color: !isBulk ? 'var(--color-text-primary)' : '#6B7280',
                            transition: 'all 0.2s'
                        }}
                    >
                        {t('common.individual') || 'Individual'}
                    </button>
                    <button
                        onClick={() => setIsBulk(true)}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: isBulk ? '600' : '400',
                            backgroundColor: isBulk ? 'white' : 'transparent',
                            boxShadow: isBulk ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            color: isBulk ? 'var(--color-text-primary)' : '#6B7280',
                            transition: 'all 0.2s'
                        }}
                    >
                        {t('common.bulk') || 'Masiva'}
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {status && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: status.type === 'success' ? '#10B981' : '#EF4444',
                            borderRadius: '12px',
                            fontSize: '14px',
                            textAlign: 'center'
                        }}>
                            {status.message}
                        </div>
                    )}

                    {!isBulk ? (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label className="text-overline" style={{ color: '#6B7280' }}>{t('auth.name')}</label>
                                <input
                                    type="text"
                                    placeholder={t('auth.namePlaceholder')}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={!isBulk}
                                    className="w-full"
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label className="text-overline" style={{ color: '#6B7280' }}>{t('auth.email')}</label>
                                <input
                                    type="email"
                                    placeholder={t('auth.emailPlaceholder')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required={!isBulk}
                                    className="w-full"
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label className="text-overline" style={{ color: '#6B7280' }}>{t('people.role')}</label>
                                <select
                                    value={roleId}
                                    onChange={(e) => setRoleId(parseInt(e.target.value))}
                                    className="w-full"
                                >
                                    <option value={2}>{t('people.roles.pastor')}</option>
                                    <option value={3}>{t('people.roles.leader')}</option>
                                    <option value={4}>{t('people.roles.member')}</option>
                                    <option value={5}>{t('people.roles.coordinator')}</option>
                                    <option value={6}>{t('people.roles.multimedia') || 'Multimedia'}</option>
                                </select>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label className="text-overline" style={{ color: '#6B7280' }}>{t('auth.emails') || 'Correos electrónicos'}</label>
                            <textarea
                                placeholder={t('auth.emailsPlaceholder') || "Ingresa los correos separados por coma o uno por línea..."}
                                value={bulkEmails}
                                onChange={(e) => setBulkEmails(e.target.value)}
                                required={isBulk}
                                rows={6}
                                className="w-full"
                                style={{ resize: 'vertical' }}
                            />
                            <p className="text-overline" style={{ color: '#9CA3AF', marginTop: '4px' }}>
                                {t('people.bulk_invite_notice') || 'Las invitaciones masivas se enviarán con el rol de "Miembro" por defecto.'}
                            </p>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <Button
                            type="button"
                            label={t('common.cancel')}
                            variant="secondary"
                            onClick={() => navigate('/people')}
                            disabled={isLoading}
                            style={{ flex: 1 }}
                        />
                        <Button
                            type="submit"
                            label={isLoading ? (t('common.sending') || 'Enviando...') : t('people.invite')}
                            variant="primary"
                            disabled={isLoading}
                            style={{ flex: 1 }}
                        />
                    </div>
                </form>
            </Card>
        </div>
    );
};



