import type { FC } from 'react';
import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const PrivacySupport: FC = () => {
    const [search, setSearch] = useState('');

    const faqs = [
        { q: '¿Cómo recupero mi cuenta?', a: 'Podés recuperar tu cuenta solicitando un enlace de restablecimiento de contraseña en la página de inicio de sesión.' },
        { q: '¿Cómo gestiono mis diezmos?', a: 'La gestión de diezmos se realiza a través del módulo de finanzas, accesible solo para roles administrativos.' },
        { q: '¿Puedo exportar reportes de membresía?', a: 'Sí, los administradores pueden exportar listados en formato PDF y Excel desde la sección de Personas.' }
    ];

    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <header>
                <h1 className="text-h1">Privacidad y Soporte</h1>
                <p className="text-body" style={{ color: '#9CA3AF' }}>Estamos aquí para ayudarte a gestionar tu iglesia de forma segura.</p>
            </header>

            {/* Search Bar */}
            <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{
                    position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280'
                }}>search</span>
                <input
                    type="text"
                    placeholder="Buscar en el Centro de Ayuda..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '16px 16px 16px 48px',
                        borderRadius: '16px',
                        border: '1px solid var(--color-border-subtle)',
                        backgroundColor: 'var(--color-ui-bg)',
                        color: 'var(--color-ui-text)',
                        outline: 'none',
                        fontSize: '15px'
                    }}
                />
            </div>

            {/* Privacy Section */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-brand-blue)' }}>
                    <span className="material-symbols-outlined">shield</span>
                    <h2 className="text-h2" style={{ margin: 0 }}>Privacidad y Seguridad</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                        { title: 'Política de Privacidad', desc: 'Cómo protegemos tu información' },
                        { title: 'Términos de Servicio', desc: 'Reglas de uso de la plataforma' },
                        { title: 'Manejo de Datos de la Iglesia', desc: 'Control de registros y membresía' }
                    ].map((item, i) => (
                        <Card key={i} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                            <div>
                                <h3 className="text-body" style={{ fontWeight: 600, margin: 0 }}>{item.title}</h3>
                                <p className="text-overline" style={{ color: '#6B7280', marginTop: '4px' }}>{item.desc}</p>
                            </div>
                            <span className="material-symbols-outlined" style={{ color: '#6B7280' }}>chevron_right</span>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Support Section */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-brand-blue)' }}>
                    <span className="material-symbols-outlined">headset_mic</span>
                    <h2 className="text-h2" style={{ margin: 0 }}>Soporte Técnico</h2>
                </div>

                <Card style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--color-ui-surface)' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'var(--color-brand-blue)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                    }}>
                        <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '28px' }}>help</span>
                    </div>
                    <h3 className="text-h2" style={{ marginBottom: '8px' }}>¿Necesitas ayuda directa?</h3>
                    <p className="text-body" style={{ color: '#9CA3AF', marginBottom: '24px' }}>
                        Nuestro equipo técnico está disponible de lunes a viernes.
                    </p>
                    <Button variant="primary" label="Contactar Soporte" style={{ width: '100%' }} />
                </Card>
            </section>

            {/* FAQs */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 className="text-overline" style={{ color: '#6B7280', letterSpacing: '1px' }}>PREGUNTAS FRECUENTES</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {faqs.map((faq, i) => (
                        <Card key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ padding: '16px', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="text-body" style={{ fontWeight: 600 }}>{faq.q}</span>
                                <span className="material-symbols-outlined" style={{
                                    transform: openFaq === i ? 'rotate(180deg)' : 'none',
                                    transition: 'transform 0.2s',
                                    color: '#6B7280'
                                }}>expand_more</span>
                            </div>
                            {openFaq === i && (
                                <p className="text-body" style={{ marginTop: '12px', color: '#9CA3AF', fontSize: '14px', lineHeight: '1.5' }}>
                                    {faq.a}
                                </p>
                            )}
                        </Card>
                    ))}
                </div>
            </section>

            <footer style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '24px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: '#4B5563', fontSize: '20px' }}>church</span>
                </div>
                <p className="text-overline" style={{ color: '#4B5563' }}>
                    Church Management Platform v2.4.0<br />
                    © 2024 Todos los derechos reservados.
                </p>
            </footer>
        </div>
    );
};
