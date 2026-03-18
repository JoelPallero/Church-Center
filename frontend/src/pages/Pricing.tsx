import { useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

const CheckIcon = () => (
    <span className="material-symbols-outlined" style={{ color: '#10B981', fontSize: '20px' }}>check_circle</span>
);

const CloseIcon = () => (
    <span className="material-symbols-outlined" style={{ color: '#94A3B8', fontSize: '20px', opacity: 0.5 }}>cancel</span>
);

export const Pricing: FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [isAnnual, setIsAnnual] = useState(true);

    const pricing = {
        pastoral: { pro: isAnnual ? 29 : 39, ultra: isAnnual ? 59 : 79 },
        ministry: { pro: isAnnual ? 19 : 25, ultra: isAnnual ? 39 : 49 },
        tech: { pro: isAnnual ? 15 : 19, ultra: isAnnual ? 29 : 39 },
        diaconos: { pro: isAnnual ? 12 : 15, ultra: isAnnual ? 24 : 32 },
        social: { pro: isAnnual ? 19 : 25, ultra: isAnnual ? 39 : 49 }
    };

    const hubs = [
        {
            title: 'Pastoral Hub',
            id: 'pastoral',
            features: [
                { name: 'Analíticas en tiempo real', free: true, pro: true, ultra: true },
                { name: 'Reportes interactivos', free: false, pro: true, ultra: true },
                { name: 'Gráficos de miembros', free: false, pro: true, ultra: true },
                { name: 'Tendencias de asistencia', free: false, pro: true, ultra: true },
                { name: 'Métricas de desempeño', free: false, pro: false, ultra: true },
                { name: 'Dashboards personalizados', free: false, pro: false, ultra: true },
            ],
            prices: pricing.pastoral
        },
        {
            title: 'Ministry Hub',
            id: 'ministry',
            features: [
                { name: 'Biblioteca de canciones básica', free: true, pro: true, ultra: true },
                { name: 'Gestión de Playlists', free: true, pro: true, ultra: true },
                { name: 'Programación de equipos', free: false, pro: true, ultra: true },
                { name: 'Reproducción Multi-tracks', free: false, pro: true, ultra: true },
            ],
            prices: pricing.ministry
        },
        {
            title: 'Tech Hub',
            id: 'tech',
            features: [
                { name: 'Notas de multimedia', free: true, pro: true, ultra: true },
                { name: 'Cues de iluminación', free: false, pro: true, ultra: true },
                { name: 'Integración con Live Stream', free: false, pro: true, ultra: true },
            ],
            prices: pricing.tech
        },
        {
            title: 'Diaconos Hub',
            id: 'diaconos',
            features: [
                { name: 'Coordinación de Ujieres', free: true, pro: true, ultra: true },
                { name: 'Experiencia de invitados', free: false, pro: true, ultra: true },
                { name: 'Check-in digital', free: false, pro: false, ultra: true },
            ],
            prices: pricing.diaconos
        },
        {
            title: 'Social Media Hub',
            id: 'social',
            features: [
                { name: 'Gestión de reels', free: true, pro: true, ultra: true },
                { name: 'Programación de posts', free: false, pro: true, ultra: true },
                { name: 'Analíticas de alcance', free: false, pro: true, ultra: true },
            ],
            prices: pricing.social
        }
    ];

    return (
        <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', color: '#121212', fontFamily: 'Inter, sans-serif' }}>
            {/* Header (Coincide con Home.tsx) */}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}>
                        <div style={{ width: '32px', height: '32px', backgroundColor: '#3d68df', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '20px' }}>church</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' }}>Service Manager</span>
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
                                v1.0
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
            <header className="section-padding" style={{
                paddingTop: '80px',
                paddingBottom: '60px',
                textAlign: 'center',
                maxWidth: '1366px',
                margin: '0 auto'
            }}>
                <h1 style={{ fontSize: '48px', fontWeight: 900, marginBottom: '16px', letterSpacing: '-1.5px' }}>Planes y Servicios</h1>
                <p style={{ fontSize: '18px', color: '#64748B', maxWidth: '600px', margin: '0 auto 40px' }}>
                    Seleccioná el plan que mejor se adapte a las necesidades de cada departamento de tu iglesia.
                </p>

                {/* Toggle Group */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '40px' }}>
                    <span style={{ fontWeight: isAnnual ? 500 : 700, color: isAnnual ? '#64748B' : '#121212' }}>Mensual</span>
                    <div
                        onClick={() => setIsAnnual(!isAnnual)}
                        style={{
                            width: '56px',
                            height: '32px',
                            backgroundColor: '#3d68df',
                            borderRadius: '16px',
                            padding: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: isAnnual ? 'flex-end' : 'flex-start',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <div style={{ width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}></div>
                    </div>
                    <span style={{ fontWeight: isAnnual ? 700 : 500, color: isAnnual ? '#121212' : '#64748B' }}>
                        Anual <span style={{ color: '#10B981', fontSize: '13px', marginLeft: '4px' }}>-20%</span>
                    </span>
                </div>
            </header>

            {/* Tables for each Hub */}
            <main className="section-padding" style={{ maxWidth: '1366px', margin: '0 auto', display: 'grid', gap: '80px', paddingBottom: '100px' }}>
                {hubs.map((hub, hIdx) => (
                    <div key={hIdx} style={{ display: 'grid', gap: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ padding: '8px 16px', backgroundColor: '#E0E7FF', color: '#3730A3', borderRadius: '12px', fontSize: '14px', fontWeight: 700 }}>
                                {hub.title.toUpperCase()}
                            </div>
                            <div style={{ height: '1px', flex: 1, backgroundColor: '#E2E8F0' }}></div>
                        </div>

                        <div style={{
                            overflowX: 'auto',
                            border: '1px solid #E2E8F0',
                            borderRadius: '24px',
                            backgroundColor: '#FFFFFF',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#F8FAFC' }}>
                                        <th style={{ padding: '24px 32px', width: '40%', fontSize: '13px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>Características</th>
                                        <th style={{ padding: '24px 32px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 800 }}>Plan Free</div>
                                            <div style={{ color: '#64748B', fontWeight: 500, fontSize: '13px' }}>$0</div>
                                        </th>
                                        <th style={{ padding: '24px 32px', textAlign: 'center', backgroundColor: '#EFF6FF' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E40AF' }}>Plan Pro</div>
                                            <div style={{ color: '#1E40AF', fontWeight: 700, fontSize: '13px' }}>${hub.prices.pro}/mes</div>
                                        </th>
                                        <th style={{ padding: '24px 32px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 800 }}>Plan Ultra</div>
                                            <div style={{ color: '#64748B', fontWeight: 500, fontSize: '13px' }}>${hub.prices.ultra}/mes</div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hub.features.map((f, fIdx) => (
                                        <tr key={fIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                            <td style={{ padding: '16px 32px', fontWeight: 500, color: '#334155' }}>{f.name}</td>
                                            <td style={{ padding: '16px 32px', textAlign: 'center' }}>{f.free ? <CheckIcon /> : <CloseIcon />}</td>
                                            <td style={{ padding: '16px 32px', textAlign: 'center', backgroundColor: '#EFF6FF80' }}>{f.pro ? <CheckIcon /> : <CloseIcon />}</td>
                                            <td style={{ padding: '16px 32px', textAlign: 'center' }}>{f.ultra ? <CheckIcon /> : <CloseIcon />}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ backgroundColor: '#F8FAFC' }}>
                                        <td style={{ padding: '24px 32px' }}></td>
                                        <td style={{ padding: '24px 32px', textAlign: 'center' }}>
                                            <Button className="btn-plan-outline" label="Empezar Gratis" style={{ width: '100%' }} />
                                        </td>
                                        <td style={{ padding: '24px 32px', textAlign: 'center', backgroundColor: '#EFF6FF' }}>
                                            <Button variant="primary" label="Elegir Pro" style={{ width: '100%' }} />
                                        </td>
                                        <td style={{ padding: '24px 32px', textAlign: 'center' }}>
                                            <Button className="btn-plan-outline" label="Elegir Ultra" style={{ width: '100%' }} />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                {/* Custom Features Form */}
                <section style={{ marginTop: '40px', textAlign: 'center' }}>
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{ color: '#3d68df', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>Personalización</div>
                        <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '20px' }}>Solicitá custom features</h2>
                        <p style={{ color: '#64748B', marginBottom: '40px' }}>¿Necesitas algo específico para tu comunidad? Contanos y lo desarrollamos para vos.</p>

                        <div style={{ padding: '40px', textAlign: 'left', borderRadius: '32px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                            <form style={{ display: 'grid', gap: '24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Nombre</label>
                                        <input type="text" placeholder="Tu nombre" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Iglesia</label>
                                        <input type="text" placeholder="Nombre de la iglesia" style={inputStyle} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Email</label>
                                    <input type="email" placeholder="email@ejemplo.com" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Mensaje</label>
                                    <textarea placeholder="¿Qué funcionalidad necesitas?" rows={5} style={inputStyle}></textarea>
                                </div>
                                <Button
                                    variant="primary"
                                    label="Enviar Solicitud"
                                    style={{ height: '56px', width: '100%', fontSize: '16px' }}
                                />
                            </form>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer (Coincide con Home.tsx) */}
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
                            <span style={{ fontWeight: 800, fontSize: '18px' }}>Service Manager</span>
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
                        © {new Date().getFullYear()} Service Manager. Todos los derechos reservados. Edificando el Reino.
                    </p>
                </div>
            </footer>

            <style>{`
                .section-padding {
                    padding-left: 20px;
                    padding-right: 20px;
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
                @media (min-width: 1025px) {
                    .section-padding {
                        padding-left: 0;
                        padding-right: 0;
                    }
                }
                @media (max-width: 768px) {
                    .desktop-only {
                        display: none;
                    }
                    table th, table td {
                        padding: 12px 16px !important;
                    }
                }
            `}</style>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    fontSize: '15px',
    fontFamily: 'inherit',
    outline: 'none',
    backgroundColor: '#F8FAFC'
};
