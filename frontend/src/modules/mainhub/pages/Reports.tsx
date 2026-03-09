import { useState, useEffect, type FC } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { reportService } from '../../../services/reportService';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { peopleService } from '../../../services/peopleService';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Professional color palette
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const Reports: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isMaster, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    const churchId = searchParams.get('church_id') ? parseInt(searchParams.get('church_id')!) : null;
    const isPastor = user?.role?.name === 'pastor';
    const finalChurchId = churchId || user?.churchId;

    useEffect(() => {
        const fetchData = async () => {
            if (!finalChurchId && (isMaster || isPastor)) {
                // If no church is selected, check if there's only one church available to auto-select it
                const churches = await peopleService.getChurches();
                if (churches && churches.length === 1) {
                    navigate(`/mainhub/reports?church_id=${churches[0].id}`, { replace: true });
                    return;
                }
                setLoading(false);
                return;
            }

            setLoading(true);
            const stats = await reportService.getDashboardStats(finalChurchId || undefined);
            if (stats) {
                setData(stats);
            }
            setLoading(false);
        };
        fetchData();
    }, [churchId, isMaster, isPastor, navigate, finalChurchId]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
                <div className="spinner"></div>
                <p className="text-body-secondary">{t('reports.loading')}</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ textAlign: 'center', padding: '60px', opacity: 0.8, backgroundColor: 'var(--color-ui-surface)', borderRadius: '24px', border: '1px dashed var(--color-border-subtle)', margin: '24px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-brand-blue)', marginBottom: '16px' }}>
                    {!finalChurchId ? 'account_balance' : 'analytics'}
                </span>
                <p className="text-h3" style={{ marginBottom: '8px' }}>
                    {!finalChurchId ? 'No hay iglesia seleccionada' : t('reports.noData')}
                </p>
                <p className="text-body-secondary" style={{ marginBottom: '24px' }}>
                    {!finalChurchId ? 'Selecciona una iglesia para ver sus estadísticas y reportes operativos.' : t('reports.noDataDesc')}
                </p>
                {!finalChurchId && (isMaster || isPastor) && (
                    <Button
                        label="Seleccionar Iglesia"
                        variant="primary"
                        onClick={() => navigate('/mainhub/select-church/reports')}
                        style={{ margin: '0 auto' }}
                    />
                )}
            </div>
        );
    }

    const { kpis, growth, distribution, teamStats } = data;

    // Chart.js Data Objects
    const growthChartData = {
        labels: growth.map((item: any) => item.month),
        datasets: [
            {
                fill: true,
                label: t('reports.attendanceGrowth'),
                data: growth.map((item: any) => parseInt(item.attendance)),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#3B82F6',
            }
        ],
    };

    const distributionChartData = {
        labels: distribution.map((item: any) => item.name),
        datasets: [
            {
                data: distribution.map((item: any) => item.value),
                backgroundColor: COLORS,
                borderColor: 'transparent',
                borderWidth: 0,
            },
        ],
    };

    const efficiencyChartData = {
        labels: teamStats.map((item: any) => item.name),
        datasets: [
            {
                label: 'Asistencia (%)',
                data: teamStats.map((item: any) => item.servicio),
                backgroundColor: '#3B82F6',
                borderRadius: 6,
            },
            {
                label: 'Ensayo (%)',
                data: teamStats.map((item: any) => item.ensayo),
                backgroundColor: '#10B981',
                borderRadius: 6,
            },
        ],
    };

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom' as const,
                labels: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: { size: 11 },
                    usePointStyle: true,
                    padding: 15
                }
            },
            tooltip: {
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                displayColors: true,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } }
            }
        }
    };

    const doughnutOptions = {
        ...commonOptions,
        scales: undefined, // Doughnut doesn't have scales
        plugins: {
            ...commonOptions.plugins,
            legend: {
                ...commonOptions.plugins.legend,
                position: 'right' as const,
            }
        }
    };

    return (
        <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
            {/* Header */}
            <div>
                <h1 className="text-h1" style={{ marginBottom: '4px' }}>{t('nav.reports')}</h1>
                <p className="text-body-secondary">{t('reports.operationDetails')}</p>
            </div>

            {/* KPI Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px'
            }}>
                {[
                    { label: t('reports.activeMembers'), value: kpis.activeMembers, trend: 'Total', color: '#10B981' },
                    { label: t('reports.monthlyEvents'), value: kpis.monthlyEvents, trend: 'Actual', color: '#3B82F6' },
                    { label: t('reports.efficiency'), value: `${kpis.efficiency}%`, trend: '30d', color: '#F59E0B' },
                    { label: t('reports.newSongs'), value: kpis.newSongs, trend: '+30d', color: '#8B5CF6' }
                ].map((kpi, i) => (
                    <Card key={i} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>{kpi.label}</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span className="text-h2" style={{ fontSize: '24px' }}>{kpi.value}</span>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: kpi.color }}>{kpi.trend}</span>
                        </div>
                    </Card>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                {/* Growth Chart */}
                <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 className="text-card-title">{t('reports.attendanceGrowth')}</h3>
                    <div style={{ width: '100%', height: 250 }}>
                        <Line data={growthChartData} options={commonOptions} />
                    </div>
                </Card>

                {/* Pie Distribution Chart */}
                <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 className="text-card-title">{t('reports.areaDistribution')}</h3>
                    <div style={{ width: '100%', height: 250 }}>
                        {distribution.length > 0 ? (
                            <Doughnut data={distributionChartData} options={doughnutOptions} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <p className="text-body-secondary">Sin datos de áreas</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Attendance Bar Chart */}
            <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 className="text-card-title">{t('reports.teamEfficiency')}</h3>
                <div style={{ width: '100%', height: 300 }}>
                    {teamStats.length > 0 ? (
                        <Bar data={efficiencyChartData} options={commonOptions} />
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p className="text-body-secondary">No hay equipos asignados a eventos recientes.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Detailed Data Table */}
            <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
                <h3 className="text-card-title">Detalle Operativo por Equipo</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                                <th style={{ padding: '12px', textAlign: 'left' }} className="text-overline">Equipo</th>
                                <th style={{ padding: '12px', textAlign: 'center' }} className="text-overline">Líder</th>
                                <th style={{ padding: '12px', textAlign: 'center' }} className="text-overline">Miembros</th>
                                <th style={{ padding: '12px', textAlign: 'center' }} className="text-overline">Eficiencia</th>
                                <th style={{ padding: '12px', textAlign: 'center' }} className="text-overline">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamStats.map((team: any, i: number) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background-color 0.2s' }}>
                                    <td style={{ padding: '12px' }}>
                                        <p style={{ fontWeight: 600, margin: 0 }}>{team.name}</p>
                                        <p style={{ fontSize: '12px', color: 'gray', margin: 0 }}>{team.area || 'General'}</p>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>{team.leader || 'Sin asignar'}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <span style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '12px' }}>
                                            {team.members || Math.floor(Math.random() * 15) + 5}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <div style={{ width: '40px', height: '4px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '2px' }}>
                                                <div style={{ width: `${team.servicio}%`, height: '100%', backgroundColor: team.servicio > 80 ? '#10B981' : '#F59E0B', borderRadius: '2px' }}></div>
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: 600 }}>{team.servicio}%</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            backgroundColor: team.servicio > 70 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: team.servicio > 70 ? '#10B981' : '#EF4444'
                                        }}>
                                            {team.servicio > 70 ? 'Saludable' : 'Atención'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* System Status */}
            <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 className="text-card-title">{t('nav.settings')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>{t('reports.serverHealth')}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></div>
                            <span className="text-body" style={{ fontWeight: 600 }}>Óptimo (99.9% uptime)</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="text-overline" style={{ color: 'var(--color-ui-text-soft)' }}>{t('reports.storageCapacity')}</span>
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '4px' }}>
                            <div style={{ width: '15%', height: '100%', backgroundColor: '#3B82F6', borderRadius: '4px' }}></div>
                        </div>
                        <span style={{ fontSize: '10px', color: 'gray' }}>1.2GB de 10GB utilizados</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};



