import { createContext, useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthService } from '../services/authService';
import i18n from '../i18n/config';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme');
        return (saved as Theme) || 'dark';
    });

    // Sync theme when user changes (on login/load)
    useEffect(() => {
        if (user?.defaultTheme) {
            setThemeState(user.defaultTheme as Theme);
        }
        if (user?.defaultLanguage) {
            i18n.changeLanguage(user.defaultLanguage);
        }
    }, [user]);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setThemeState(newTheme);
        if (user) {
            await AuthService.updateSettings(newTheme, i18n.language);
        }
    };

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        if (user) {
            await AuthService.updateSettings(newTheme, i18n.language);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
