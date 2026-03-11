import { createContext, useState, useContext, useEffect, type FC, type PropsWithChildren } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslation } from 'react-i18next';

export type TutorialId = 'meetings' | 'songs' | 'playlists' | 'worship_list' | 'worship_detail' | 'worship_editor';

interface TutorialContextType {
    showTutorials: boolean;
    setShowTutorials: (show: boolean) => void;
    startTutorial: (tutorialId: TutorialId) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: FC<PropsWithChildren> = ({ children }) => {
    const { t } = useTranslation();
    const [showTutorials, setShowTutorials] = useState<boolean>(() => {
        const saved = localStorage.getItem('user_show_tutorials');
        return saved === null ? true : saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('user_show_tutorials', showTutorials.toString());
    }, [showTutorials]);

    const startTutorial = (tutorialId: TutorialId) => {
        if (!showTutorials) return;

        const d = driver({
            showProgress: true,
            animate: true,
            doneBtnText: t('tutorials.btn.done'),
            nextBtnText: t('tutorials.btn.next'),
            prevBtnText: t('tutorials.btn.prev'),
            steps: getSteps(tutorialId) as any
        });

        d.drive();
    };

    const getSteps = (tutorialId: TutorialId) => {
        switch (tutorialId) {
            case 'meetings':
                return [
                    { element: '#calendar-header', popover: { title: t('tutorials.meetings.title'), description: t('tutorials.meetings.desc'), side: "bottom", align: 'start' } },
                    { element: '#btn-new-meeting', popover: { title: t('tutorials.meetings.newTitle'), description: t('tutorials.meetings.newDesc'), side: "left", align: 'center' } },
                    { element: '#tab-meetings', popover: { title: t('tutorials.meetings.tabsTitle'), description: t('tutorials.meetings.tabsDesc'), side: "bottom", align: 'center' } }
                ];
            case 'songs':
                return [
                    { element: '#songs-header', popover: { title: t('tutorials.songs.title'), description: t('tutorials.songs.desc'), side: "bottom", align: 'start' } },
                    { element: '#btn-new-song', popover: { title: t('tutorials.songs.newTitle'), description: t('tutorials.songs.newDesc'), side: "left", align: 'center' } },
                    { element: '#songs-search', popover: { title: t('tutorials.songs.searchTitle'), description: t('tutorials.songs.searchDesc'), side: "bottom", align: 'center' } }
                ];
            case 'playlists':
                return [
                    { element: '#playlists-header', popover: { title: t('tutorials.playlists.title'), description: t('tutorials.playlists.desc'), side: "bottom", align: 'start' } },
                    { element: '#btn-new-playlist', popover: { title: t('tutorials.playlists.newTitle'), description: t('tutorials.playlists.newDesc'), side: "left", align: 'center' } }
                ];
            case 'worship_list':
                return [
                    { element: '#songs-header', popover: { title: t('tutorials.worship.welcome.title'), description: t('tutorials.worship.welcome.desc'), side: "bottom", align: 'start' } },
                    { element: '#songs-list-table', popover: { title: t('tutorials.worship.list.title'), description: t('tutorials.worship.list.desc'), side: "top" } },
                    { element: '#song-quick-view', popover: { title: t('tutorials.worship.quickView.title'), description: t('tutorials.worship.quickView.desc'), side: "left" } },
                    { element: '#songs-metronome-quick', popover: { title: t('tutorials.worship.metronome.title'), description: t('tutorials.worship.metronome.desc'), side: "bottom" } },
                    { element: '#btn-full-view', popover: { title: t('tutorials.worship.fullView.title'), description: t('tutorials.worship.fullView.desc'), side: "top" } }
                ];
            case 'worship_detail':
                return [
                    { element: '#song-metronome-full', popover: { title: t('tutorials.worship.metronome.title'), description: t('tutorials.worship.metronome.desc'), side: "bottom" } },
                    { element: '#song-transpose-controls', popover: { title: t('tutorials.worship.transpose.title'), description: t('tutorials.worship.transpose.desc'), side: "bottom" } },
                    { element: '#song-notation-controls', popover: { title: t('tutorials.worship.notation.title'), description: t('tutorials.worship.notation.desc'), side: "top" } },
                    { element: '#song-fontsize-controls', popover: { title: t('tutorials.worship.fontSize.title'), description: t('tutorials.worship.fontSize.desc'), side: "top" } },
                    { element: '#btn-back-worship', popover: { title: t('songs.backToLibrary'), description: t('tutorials.worship.create.desc'), side: "bottom" } }
                ];
            case 'worship_editor':
                return [
                    { element: '#song-editor-name', popover: { title: t('tutorials.worship.formBasic.title'), description: t('tutorials.worship.formBasic.desc'), side: "bottom" } },
                    { element: '#song-editor-key', popover: { title: t('songs.key'), description: t('tutorials.worship.formBasic.desc'), side: "bottom" } },
                    { element: '#song-editor-bpm', popover: { title: "BPM", description: t('tutorials.worship.formBasic.desc'), side: "bottom" } },
                    { element: '#song-content-area', popover: { title: t('tutorials.worship.editor.title'), description: t('tutorials.worship.editor.desc'), side: "top" } },
                    { element: '#song-section-buttons', popover: { title: t('tutorials.worship.sections.title'), description: t('tutorials.worship.sections.desc'), side: "bottom" } },
                    { element: '#song-singer-assignments', popover: { title: t('tutorials.worship.singers.title'), description: t('tutorials.worship.singers.desc'), side: "top" } },
                    { element: '#btn-save-song', popover: { title: t('tutorials.worship.save.title'), description: t('tutorials.worship.save.desc'), side: "left" } }
                ];
            default:
                return [];
        }
    };

    return (
        <TutorialContext.Provider value={{ showTutorials, setShowTutorials, startTutorial }}>
            {children}
        </TutorialContext.Provider>
    );
};

export const useTutorials = () => {
    const context = useContext(TutorialContext);
    if (!context) throw new Error('useTutorials must be used within TutorialProvider');
    return context;
};
