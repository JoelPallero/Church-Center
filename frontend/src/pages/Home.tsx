import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';

export const Home: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const hubs = [
        {
            id: 'ministry',
            title: 'Ministry Hub',
            subtitle: t('home.hubs.ministry.subtitle', 'Excelencia en Alabanza y Música'),
            description: t('home.hubs.ministry.description', 'Gestiona tus equipos de alabanza, repertorios y biblioteca de canciones con facilidad.'),
            icon: 'music_note',
            color: '#3B82F6'
        },
        {
            id: 'tech',
            title: 'Tech Hub',
            subtitle: t('home.hubs.tech.subtitle', 'Potencia en Producción'),
            description: t('home.hubs.tech.description', 'Todo para los técnicos de multimedia, iluminación y sonido.'),
            icon: 'settings_input_component',
            color: '#6366F1'
        },
        {
            id: 'diaconos',
            title: 'Diaconos Hub',
            subtitle: t('home.hubs.diaconos.subtitle', 'Servicio y Logística'),
            description: t('home.hubs.diaconos.description', 'Coordina a los ujieres, equipos de bienvenida y la experiencia de los invitados.'),
            icon: 'groups',
            color: '#10B981'
        },
        {
            id: 'social',
            title: 'Social Media Hub',
            subtitle: t('home.hubs.social.subtitle', 'Alcance Digital'),
            description: t('home.hubs.social.description', 'Domina tus reels, historias y transmisiones en vivo en todas las plataformas.'),
            icon: 'share',
            color: '#EC4899'
        }
    ];

    return (
        <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', color: '#121212', fontFamily: 'Inter, sans-serif' }}>
            {/* Navigation */}
            <nav className="section-padding" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                paddingTop: '20px',
                paddingBottom: '20px',
                position: 'sticky',
                top: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                zIndex: 1000,
                borderBottom: '1px solid #E2E8F0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '1366px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', backgroundColor: '#3d68df', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '20px' }}>church</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' }}>Church Center</span>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: '#3d68df',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                letterSpacing: '0.05em',
                                lineHeight: 1
                            }}>
                                Beta
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {isAuthenticated ? (
                                <Button
                                    variant="primary"
                                    label="Ir a la App"
                                    onClick={() => navigate('/dashboard')}
                                />
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        className="btn-header-login"
                                        label="Ingresar"
                                        onClick={() => navigate('/login')}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="section-padding" style={{
                paddingTop: '100px',
                paddingBottom: '80px',
                textAlign: 'center',
                maxWidth: '1366px',
                margin: '0 auto',
                background: 'radial-gradient(circle at top, #f0f7ff 0%, #ffffff 50%)'
            }}>
                <div style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    backgroundColor: '#E0E7FF',
                    color: '#3730A3',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '24px'
                }}>
                    NUEVO: LLEGÓ EL ECOSISTEMA DE HUBS
                </div>
                <h1 style={{
                    fontSize: 'clamp(32px, 5vw, 64px)',
                    fontWeight: 900,
                    lineHeight: 1.1,
                    marginBottom: '24px',
                    letterSpacing: '-1px'
                }}>
                    El Centro de Mando Definitivo <br />
                    <span style={{ color: '#3d68df' }}>para tu Iglesia.</span>
                </h1>
                <p style={{
                    fontSize: '18px',
                    color: '#64748B',
                    maxWidth: '700px',
                    margin: '0 auto 40px',
                    lineHeight: 1.6
                }}>
                    Unifica tu ministerio, tecnología y administración en una plataforma potente.
                    Diseñado para iglesias modernas con visión global.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <Button
                        variant="primary"
                        label="Conectar mi Iglesia"
                        style={{ height: '56px', padding: '0 32px', fontSize: '16px' }}
                        onClick={() => navigate('/login')}
                    />
                </div>
            </section>

            {/* Hub Ecosystem */}
            <section id="services" className="section-padding" style={{ paddingTop: '100px', paddingBottom: '80px', maxWidth: '1366px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <div style={{ color: '#3d68df', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>Hubs por Departamento</div>
                    <h2 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-1px' }}>El Ecosistema de Hubs</h2>
                    <p style={{ color: '#64748B', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                        Herramientas especializadas para cada área de tu ministerio.
                    </p>
                </div>

                <div
                    className="hubs-grid"
                    style={{
                        display: 'grid',
                        gap: '32px'
                    }}
                >
                    {hubs.map(hub => (
                        <Card key={hub.id} style={{
                            padding: '40px',
                            border: '1px solid #E2E8F0',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                            borderRadius: '24px',
                            transition: 'all 0.3s ease',
                            cursor: 'default',
                            backgroundColor: '#FFFFFF',
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%'
                        }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '16px',
                                backgroundColor: `${hub.color}10`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '24px'
                            }}>
                                <span className="material-symbols-outlined" style={{ color: hub.color, fontSize: '28px' }}>{hub.icon}</span>
                            </div>
                            <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>{hub.title}</h3>
                            <p style={{ color: '#64748B', lineHeight: 1.6, fontSize: '15px', flex: 1 }}>
                                {hub.description}
                            </p>
                            <div
                                onClick={() => navigate('/pricing')}
                                style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: hub.color, fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
                            >
                                Explorar Función <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Pastoral Hub Feature */}
            <section id="pastoral" className="section-padding" style={{ paddingTop: '80px', paddingBottom: '120px', backgroundColor: '#F8FAFC' }}>
                <div style={{
                    maxWidth: '1366px',
                    margin: '0 auto',
                    padding: '80px 60px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '40px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '60px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)'
                }}>
                    <div style={{ flex: '1 1 500px' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 16px',
                            backgroundColor: '#EEF2FF',
                            color: '#4338CA',
                            borderRadius: '100px',
                            fontSize: '12px',
                            fontWeight: 700,
                            marginBottom: '24px'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                            PANEL PREMIUM
                        </div>
                        <h2 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '24px', letterSpacing: '-1px', color: '#0F172A' }}>
                            Pastoral Hub: Visión y Control Total
                        </h2>
                        <p style={{ fontSize: '18px', color: '#64748B', marginBottom: '32px', lineHeight: 1.6 }}>
                            Obtén una vista panorámica de toda tu organización con analíticas refinadas y herramientas de gestión de equipos. Toma decisiones basadas en datos para impulsar el crecimiento.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                            {[
                                'Analíticas de asistencia y ofrendas en tiempo real',
                                'Canales directos de comunicación con el liderazgo',
                                'Planificación estratégica y seguimiento de KPIs'
                            ].map((text, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span className="material-symbols-outlined" style={{ color: '#10B981', fontSize: '20px' }}>check_circle</span>
                                    <span style={{ fontWeight: 500, color: '#334155' }}>{text}</span>
                                </div>
                            ))}
                        </div>

                        <Button
                            variant="primary"
                            label="Solicitar Acceso"
                            style={{ height: '48px', padding: '0 24px' }}
                        />
                    </div>

                    <div style={{
                        flex: '1 1 400px',
                        backgroundColor: '#F1F5F9',
                        borderRadius: '24px',
                        padding: '24px',
                        border: '1px solid #E2E8F0',
                        position: 'relative'
                    }}>
                        {/* Mockup of a dashboard */}
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <div style={{ height: '12px', width: '40%', backgroundColor: '#E2E8F0', borderRadius: '6px', marginBottom: '16px' }}></div>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ height: '60px', flex: 1, backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}></div>
                                <div style={{ height: '60px', flex: 1, backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}></div>
                            </div>
                            <div style={{ height: '100px', width: '100%', background: 'linear-gradient(to top, #3B82F610, #3B82F630)', borderRadius: '12px', display: 'flex', alignItems: 'flex-end', padding: '10px', gap: '4px' }}>
                                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                                    <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: '#3B82F6', borderRadius: '4px 4px 0 0' }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="section-padding" style={{
                paddingTop: '60px',
                paddingBottom: '60px',
                borderTop: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC'
            }}>
                <div style={{
                    maxWidth: '1366px',
                    margin: '0 auto',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '40px',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ maxWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                            <div style={{ width: '24px', height: '24px', backgroundColor: '#3d68df', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '14px' }}>church</span>
                            </div>
                            <span style={{ fontWeight: 800, fontSize: '18px' }}>Church Center</span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>
                            Global platform for church management, production, and ministry coordination.
                            Available in Spanish, English, and Portuguese.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '60px' }}>
                        <div>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plataforma</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <li><span style={{ cursor: 'pointer', color: '#64748B', fontSize: '14px' }} onClick={() => navigate('/pricing')}>Ministry Hub</span></li>
                                <li><span style={{ cursor: 'pointer', color: '#64748B', fontSize: '14px' }} onClick={() => navigate('/pricing')}>Diaconos Hub</span></li>
                                <li><span style={{ cursor: 'pointer', color: '#64748B', fontSize: '14px' }} onClick={() => navigate('/pricing')}>Tech Hub</span></li>
                                <li><span style={{ cursor: 'pointer', color: '#64748B', fontSize: '14px' }} onClick={() => navigate('/pricing')}>Social Media</span></li>
                            </ul>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organización</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <li><a href="#" style={{ textDecoration: 'none', color: '#64748B', fontSize: '14px' }}>Documentación</a></li>
                                <li><a href="#" style={{ textDecoration: 'none', color: '#64748B', fontSize: '14px' }}>Soporte</a></li>
                                <li><a href="#" style={{ textDecoration: 'none', color: '#64748B', fontSize: '14px' }}>Legal</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="section-padding" style={{ maxWidth: '1366px', margin: '40px auto 0', paddingTop: '40px', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#94A3B8' }}>
                        © {new Date().getFullYear()} Church Center. Todos los derechos reservados. Edificando el Reino.
                    </p>
                </div>
            </footer>

            <style>{`
                .hubs-grid {
                    grid-template-columns: repeat(4, 1fr);
                }
                .section-padding {
                    padding-left: 20px;
                    padding-right: 20px;
                }
                @media (min-width: 1025px) {
                    .section-padding {
                        padding-left: 0;
                        padding-right: 0;
                    }
                }
                @media (max-width: 1024px) {
                    .hubs-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                @media (max-width: 640px) {
                    .hubs-grid {
                        grid-template-columns: 1fr;
                    }
                    .desktop-only {
                        display: none;
                    }
                }
                .btn-plan-outline {
                    background-color: transparent !important;
                    color: #3d68df !important;
                    border: 1px solid #3d68df !important;
                    box-shadow: none !important;
                    transition: all 0.2s ease-in-out !important;
                }
                .btn-plan-outline:hover {
                    background-color: #3d68df !important;
                    color: white !important;
                    box-shadow: 0 10px 15px -3px rgba(61, 104, 223, 0.2) !important;
                }
                .btn-header-login {
                    background-color: transparent !important;
                    color: #3d68df !important;
                    border: 1px solid #3d68df !important;
                    box-shadow: none !important;
                    transition: all 0.2s ease-in-out !important;
                }
                .btn-header-login:hover {
                    box-shadow: 0 4px 6px -1px rgba(61, 104, 223, 0.1), 0 2px 4px -1px rgba(61, 104, 223, 0.06) !important;
                }
            `}</style>
        </div>
    );
};
