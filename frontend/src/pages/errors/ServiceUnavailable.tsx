import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export const ServiceUnavailable: FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex-center w-full min-h-screen" style={{ backgroundColor: 'var(--color-ui-bg)', padding: '24px' }}>
      <div className="card animate-fadeIn" style={{
        maxWidth: '480px',
        padding: '48px 32px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        background: 'var(--color-glass-surface)',
        backdropFilter: 'blur(20px) saturate(180%)',
      }}>
        <div style={{
          fontSize: '120px',
          fontWeight: 900,
          background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
          opacity: 0.15,
          position: 'absolute',
          top: '10px',
          zIndex: -1
        }}>
          503
        </div>

        <div className="flex-center" style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: '#D97706',
          marginBottom: '8px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>
            construction
          </span>
        </div>

        <div>
          <h1 className="text-h1" style={{ marginBottom: '12px' }}>
            {t('errors.503.title', 'Servicio en mantenimiento')}
          </h1>
          <p className="text-body-secondary">
            {t('errors.503.message', 'Estamos realizando tareas de mantenimiento para mejorar tu experiencia. Volveremos pronto.')}
          </p>
        </div>

        <div style={{ width: '100%', marginTop: '8px' }}>
          <div style={{
            padding: '12px',
            backgroundColor: 'var(--color-ui-surface)',
            borderRadius: '12px',
            fontSize: '12px',
            color: 'var(--color-ui-text-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
            Estimamos volver en unos minutos
          </div>
        </div>

        <button 
          className="btn-base btn-primary" 
          style={{ width: '100%', marginTop: '12px' }}
          onClick={() => window.location.reload()}
        >
          {t('common.reset', 'Verificar estado')}
        </button>
      </div>
    </div>
  );
};
