import { useState, useEffect, type FC } from 'react';
import {
    PieChart, Pie, Cell,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { reportService } from '../../../services/reportService';
import { Card } from '../../../components/ui/Card';

import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';

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
            // Redirect if no church context at all and user is Pastor (multitenant context)
            // Master users bypass selection if they want, but Pastor needs at least one ID
            if (!finalChurchId && (isMaster || isPastor)) {
                navigate('/mainhub/select-church/reports');
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
    }, [churchId, isMaster, isPastor, navigate]);

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
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'gray' }}>analytics</span>
                <p className="text-h3">{t('reports.noData')}</p>
                <p className="text-body-secondary">{t('reports.noDataDesc')}</p>
            </div>
        );
    }

    const { kpis, growth, distribution, teamStats } = data;

    // Transform growth data for chart keys
    const chartGrowthData = growth.map((item: any) => ({
        month: item.month,
        asistencia: parseInt(item.attendance),
        eventos: parseInt(item.events)
    }));

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
                {/* Area Activity Chart */}
                <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 className="text-card-title">{t('reports.attendanceGrowth')}</h3>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <AreaChart data={chartGrowthData}>
                                <defs>
                                    <linearGradient id="colorAsistencia" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                />
                                <Area type="monotone" dataKey="asistencia" stroke="#3B82F6" fillOpacity={1} fill="url(#colorAsistencia)" name="Asistencias" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Pie Distribution Chart */}
                <Card style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 className="text-card-title">{t('reports.areaDistribution')}</h3>
                    <div style={{ width: '100%', height: 250, display: 'flex', alignItems: 'center' }}>
                        {distribution.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={distribution}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {distribution.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(30, 41, 59, 0.9)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Legend verticalAlign="bottom" align="center" layout="horizontal" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ width: '100%', textAlign: 'center' }}>
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
                        <ResponsiveContainer>
                            <BarChart data={teamStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} unit="%" />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(30, 41, 59, 1)',
                                        border: 'none',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="servicio" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Asistencia (%)" />
                                <Bar dataKey="ensayo" fill="#10B981" radius={[4, 4, 0, 0]} name="Ensayo (%)" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p className="text-body-secondary">No hay equipos asignados a eventos recientes.</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* System Status (Replacing Project Timeline with more relevant info) */}
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



