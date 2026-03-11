import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Unauthorized: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
          background: 'linear-gradient(135deg, var(--color-danger-red), var(--color-brand-blue))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
          opacity: 0.15,
          position: 'absolute',
          top: '10px',
          zIndex: -1
        }}>
          403
        </div>

        <div className="flex-center" style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--color-danger-red)',
          marginBottom: '8px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>
            lock
          </span>
        </div>

        <div>
          <h1 className="text-h1" style={{ marginBottom: '12px' }}>
            {t('errors.403.title', 'Acceso restringido')}
          </h1>
          <p className="text-body-secondary">
            {t('errors.403.message', 'No tienes los permisos necesarios para ver esta sección. Por favor, contacta con un administrador.')}
          </p>
        </div>

        <div style={{ width: '100%' }}>
          <button 
            className="btn-base btn-primary" 
            style={{ width: '100%' }}
            onClick={() => navigate('/dashboard')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>dashboard</span>
            {t('nav.dashboard', 'Ir al Dashboard')}
          </button>
        </div>
        
        <button 
          className="btn-base btn-ghost" 
          style={{ width: '100%', fontSize: '13px' }}
          onClick={() => navigate(-1)}
        >
          {t('common.back', 'Volver atrás')}
        </button>
      </div>
    </div>
  );
};
