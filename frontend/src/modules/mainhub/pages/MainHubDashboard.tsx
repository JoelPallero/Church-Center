import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export const MainHubDashboard: FC = () => {
    const navigate = useNavigate();
    const { hasPermission, isSuperAdmin } = useAuth();
    const { t } = useTranslation();

    const sections = [
        {
            title: t('nav.people'),
            desc: 'Gestión de membresía y registros.',
            icon: 'person_search',
            path: '/mainhub/people',
            permission: 'church.update'
        },
        {
            title: t('nav.teams'),
            desc: 'Organización de grupos y equipos.',
            icon: 'groups',
            path: '/mainhub/teams',
            permission: 'team.read'
        },
        {
            title: t('nav.reports'),
            desc: 'Estadísticas y análisis operativo.',
            icon: 'auto_graph',
            path: '/mainhub/reports',
            permission: 'reports.view'
        },
        {
            title: t('nav.calendar'),
            desc: 'Agenda de reuniones y ensayos.',
            icon: 'event',
            path: '/worship/calendar',
            permission: 'calendar.read'
        },
        {
            title: t('songs.title'),
            desc: 'Biblioteca y listados de canciones.',
            icon: 'library_music',
            path: '/worship/songs',
            permission: 'song.read'
        },
        {
            title: t('nav.consolidation'),
            desc: 'Seguimiento de visitantes y nuevos.',
            icon: 'how_to_reg',
            path: '/mainhub/consolidation',
            permission: 'reunions.view'
        },
        {
            title: t('nav.areas'),
            desc: 'Estructura operativa de la iglesia.',
            icon: 'layers',
            path: '/mainhub/areas',
            permission: 'church.update'
        },
        {
            title: t('nav.churches'),
            desc: 'Configuración de congregación.',
            icon: 'church',
            path: '/mainhub/churches',
            visible: isSuperAdmin
        }
    ];

    const visibleSections = sections.filter(s => {
        if (s.visible !== undefined) return s.visible;
        return !s.permission || hasPermission(s.permission);
    });

    return (
        <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <header>
                <h1 className="text-h1" style={{ marginBottom: '8px' }}>MainHub</h1>
                <p className="text-body-secondary">Gestión eclesiástica centralizada y herramientas pastorales.</p>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginTop: '12px'
            }}>
                {visibleSections.map((section, idx) => (
                    <Card
                        key={idx}
                        onClick={() => navigate(section.path)}
                        style={{
                            padding: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            transition: 'all 0.2s ease',
                            border: '1px solid var(--color-border-subtle)',
                        }}
                        className="hover-card"
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--color-brand-blue)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{section.icon}</span>
                        </div>
                        <div>
                            <h3 className="text-card-title" style={{ marginBottom: '4px' }}>{section.title}</h3>
                            <p className="text-overline" style={{ color: 'var(--color-ui-text-soft)', textTransform: 'none', fontSize: '12px' }}>
                                {section.desc}
                            </p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
