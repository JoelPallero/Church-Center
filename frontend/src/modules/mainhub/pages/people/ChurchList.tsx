import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { useAuth } from '../../../../hooks/useAuth';
import { useToast } from '../../../../context/ToastContext';

export const ChurchList: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isMaster } = useAuth();
    const { addToast } = useToast();
    const [churches, setChurches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchChurches();
    }, []);

    const fetchChurches = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/churches', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                setChurches(result.churches || []);
            }
        } catch (err) {
            console.error('Error fetching churches:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredChurches = churches.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (church: any) => {
        const isRestoring = !church.is_active;
        const confirmMsg = isRestoring
            ? t('churches.confirmRestore', { name: church.name }) || `¿Deseas reactivar la iglesia ${church.name}?`
            : t('churches.confirmDelete', { name: church.name }) || `¿Estás seguro de que deseas desactivar la iglesia ${church.name}?`;

        if (!window.confirm(confirmMsg)) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const url = isRestoring ? '/api/churches/restore' : `/api/churches/${church.id}`;
            const method = isRestoring ? 'POST' : 'DELETE';
            const body = isRestoring ? JSON.stringify({ id: church.id }) : undefined;

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body
            });

            const result = await response.json();
            if (result.success) {
                const successMsg = isRestoring
                    ? t('churches.restoreSuccess', { name: church.name }) || `Iglesia ${church.name} reactivada correctamente`
                    : t('churches.deleteSuccess', { name: church.name }) || `Iglesia ${church.name} desactivada correctamente`;

                addToast(successMsg, 'success');
                fetchChurches();
            } else {
                addToast(result.error || (isRestoring ? 'Error al reactivar' : 'Error al desactivar'), 'error');
            }
        } catch (err) {
            console.error('Church action error:', err);
        }
    };

    return (
        <div>
            <header style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h1 className="text-h1">{t('churches.title')}</h1>
                    <Button
                        variant="primary"
                        icon="add"
                        label={t('churches.new')}
                        onClick={() => navigate('/mainhub/churches/new')}
                    />
                </div>

                <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <span className="material-symbols-outlined" style={{
                            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'gray'
                        }}>search</span>
                        <input
                            type="text"
                            placeholder={t('churches.search')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 12px 12px 40px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border-subtle)',
                                backgroundColor: 'var(--color-ui-bg)',
                                color: 'var(--color-ui-text)',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ padding: '0 12px' }}
                    >
                        <span className="material-symbols-outlined">filter_list</span>
                    </Button>
                </div>

                {showFilters && (
                    <Card style={{ padding: '16px' }}>
                        <p className="text-overline" style={{ color: 'gray' }}>{t('churches.filters.upcoming')}</p>
                    </Card>
                )}
            </header>

            <div style={{ display: 'grid', gap: '12px' }}>
                {isLoading ? (
                    <div className="flex-center" style={{ height: '200px' }}>
                        <div className="spinner" />
                    </div>
                ) : filteredChurches.length === 0 ? (
                    <p className="text-body" style={{ textAlign: 'center', color: 'gray', marginTop: '40px' }}>{t('churches.noResults')}</p>
                ) : (
                    filteredChurches.map(church => (
                        <Card key={church.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 16px',
                            opacity: church.is_active ? 1 : 0.6,
                            filter: church.is_active ? 'none' : 'grayscale(0.5)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--color-brand-blue)'
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>church</span>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h3 className="text-card-title">{church.name}</h3>
                                        {!church.is_active && (
                                            <span style={{
                                                fontSize: '10px',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                color: '#EF4444',
                                                fontWeight: 700,
                                                textTransform: 'uppercase'
                                            }}>
                                                {t('churches.status.inactive') || 'Desactivada'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-overline" style={{ color: 'gray', marginTop: '0px' }}>/{church.slug}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {isMaster && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/mainhub/churches/edit/${church.id}`);
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: '#6B7280',
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '4px'
                                            }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(church);
                                            }}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                color: church.is_active ? '#EF4444' : '#10B981',
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '4px'
                                            }}
                                            title={church.is_active ? t('common.delete') : t('common.restore')}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                                {church.is_active ? 'delete' : 'restore'}
                                            </span>
                                        </button>
                                    </>
                                )}
                                <span className="material-symbols-outlined" style={{ color: '#4B5563' }}>chevron_right</span>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};



