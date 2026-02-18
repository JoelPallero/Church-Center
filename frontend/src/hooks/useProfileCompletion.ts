import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

export const useProfileCompletion = () => {
    const { user } = useAuth();
    const { t } = useTranslation();

    useEffect(() => {
        if (!user) return;

        const checkProfile = async () => {
            const missingKeys: string[] = [];
            if (!user.name) missingKeys.push('name');
            if (!user.phone) missingKeys.push('phone');
            if (!user.sex) missingKeys.push('sex');

            const isMusician = user.areas?.some((a: any) =>
                a.name.toLowerCase().includes('música') ||
                a.name.toLowerCase().includes('alabanza') ||
                a.name.toLowerCase().includes('musica')
            );
            if (isMusician && (!user.instruments || user.instruments.length === 0)) {
                missingKeys.push('instruments');
            }

            if (missingKeys.length > 0) {
                try {
                    const lastCheck = localStorage.getItem('last_profile_check');
                    const now = Date.now();
                    if (lastCheck && now - parseInt(lastCheck) < 86400000) return; // Once a day

                    // Translate everything in the frontend
                    const fieldsList = missingKeys.map(key => t(`profile.missing_data.fields.${key}`)).join(', ');
                    const fullMessage = t('profile.missing_data.message', { fields: fieldsList });

                    await api.post('/notifications.php?action=check_profile', { message: fullMessage });
                    localStorage.setItem('last_profile_check', now.toString());
                } catch (e) {
                    console.error('Profile check failed', e);
                }
            }
        };

        checkProfile();
    }, [user, t]);
};
