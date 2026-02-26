import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export const WorshipDashboard: FC = () => {
    const { t } = useTranslation();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">{t('common.ministryHub')}</h1>
            <p className="text-gray-600">{t('worship.welcome') || 'Bienvenido al centro de alabanza.'}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 border rounded shadow-sm bg-white">
                    <h3 className="font-semibold">{t('nav.songs')}</h3>
                    <p className="text-sm text-gray-500">{t('songs.description') || 'Gestiona el repertorio.'}</p>
                </div>
                <div className="p-4 border rounded shadow-sm bg-white">
                    <h3 className="font-semibold">{t('nav.calendar')}</h3>
                    <p className="text-sm text-gray-500">{t('calendar.description') || 'Ver reuniones próximas.'}</p>
                </div>
            </div>
        </div>
    );
};
