import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const NotFound: FC = () => {
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
          background: 'linear-gradient(135deg, var(--color-brand-blue), #60A5FA)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
          opacity: 0.15,
          position: 'absolute',
          top: '10px',
          zIndex: -1
        }}>
          404
        </div>

        <div className="flex-center" style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: 'var(--color-brand-blue)',
          marginBottom: '8px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>
            explore_off
          </span>
        </div>

        <div>
          <h1 className="text-h1" style={{ marginBottom: '12px' }}>
            {t('errors.404.title', 'Página no encontrada')}
          </h1>
          <p className="text-body-secondary">
            {t('errors.404.message', 'Lo sentimos, el enlace que seguiste podría estar roto o la página fue eliminada.')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button 
            className="btn-base btn-secondary" 
            style={{ flex: 1 }}
            onClick={() => navigate(-1)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            {t('common.back', 'Volver')}
          </button>
          <button 
            className="btn-base btn-primary" 
            style={{ flex: 1 }}
            onClick={() => navigate('/dashboard')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>home</span>
            {t('nav.home', 'Inicio')}
          </button>
        </div>
      </div>
    </div>
  );
};
