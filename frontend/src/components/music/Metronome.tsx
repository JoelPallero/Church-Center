import { useState, useEffect, useRef, useCallback } from 'react';

interface MetronomeProps {
    bpm: number;
    isPlaying?: boolean;
    onToggle?: (playing: boolean) => void;
}

const PlayIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const PauseIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

const MusicNoteIcon = ({ color = 'white' }: { color?: string }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
);

export const Metronome = ({ bpm, isPlaying: initialPlaying = false, variant = 'floating' }: MetronomeProps & { variant?: 'floating' | 'card' | 'inline' }) => {
    const [playing, setPlaying] = useState(initialPlaying);
    const [subdivision, setSubdivision] = useState(false);

    // Use Refs to allow the scheduler to access the latest state without re-creating the loop
    const bpmRef = useRef(bpm);
    const subdivisionRef = useRef(subdivision);
    const audioContext = useRef<AudioContext | null>(null);
    const nextClickTime = useRef(0);
    const timerID = useRef<number | null>(null);
    const currentTick = useRef(0);

    // Sync refs with state
    useEffect(() => { bpmRef.current = bpm; }, [bpm]);
    useEffect(() => { subdivisionRef.current = subdivision; }, [subdivision]);

    const playClick = useCallback((time: number, isStrong: boolean) => {
        if (!audioContext.current) return;
        const osc = audioContext.current.createOscillator();
        const envelope = audioContext.current.createGain();
        const filter = audioContext.current.createBiquadFilter();

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(800, time);

        osc.type = 'square';
        osc.frequency.setValueAtTime(isStrong ? 1600 : 1000, time);

        envelope.gain.setValueAtTime(isStrong ? 0.7 : 0.40, time);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

        osc.connect(envelope);
        envelope.connect(filter);
        filter.connect(audioContext.current.destination);

        osc.start(time);
        osc.stop(time + 0.06);
    }, []);

    const scheduler = useCallback(() => {
        if (!audioContext.current) return;

        while (nextClickTime.current < audioContext.current.currentTime + 0.1) {
            const tick = currentTick.current;
            const isSub = tick % 2 !== 0;
            const isStrong = tick === 0;

            if (!isSub || subdivisionRef.current) {
                playClick(nextClickTime.current, isStrong);
            }

            const secondsPerBeat = 60.0 / bpmRef.current;
            nextClickTime.current += (secondsPerBeat / 2);
            currentTick.current = (currentTick.current + 1) % 8;
        }
        timerID.current = window.setTimeout(scheduler, 25);
    }, [playClick]);

    const toggleMetronome = (e?: any) => {
        if (e) e.stopPropagation();
        if (!playing) {
            if (!audioContext.current) {
                audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioContext.current.state === 'suspended') {
                audioContext.current.resume();
            }
            currentTick.current = 0;
            nextClickTime.current = audioContext.current.currentTime + 0.05;
            setPlaying(true);
            scheduler();
        } else {
            if (timerID.current) clearTimeout(timerID.current);
            setPlaying(false);
        }
    };

    useEffect(() => {
        return () => {
            if (timerID.current) clearTimeout(timerID.current);
        };
    }, []);

    if (variant === 'card') {
        return (
            <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={toggleMetronome}
                    className="btn-icon"
                    style={{
                        width: '28px',
                        height: '28px',
                        backgroundColor: 'var(--color-brand-blue)',
                        color: 'white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                >
                    {playing ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    )}
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); setSubdivision(!subdivision); }}
                    className="btn-icon"
                    style={{
                        width: '28px',
                        height: '28px',
                        backgroundColor: subdivision ? 'var(--color-brand-blue)' : 'var(--color-ui-surface)',
                        color: subdivision ? 'white' : 'var(--color-ui-text)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                    title="Corcheas"
                >
                    <MusicNoteIcon color="currentColor" />
                </button>
            </div>
        );
    }

    if (variant === 'inline') {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="text-overline" style={{ color: 'gray', fontSize: '10px' }}>RITMO</span>
                    <span style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--color-ui-text)' }}>
                        {bpm} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'gray' }}>BPM</span>
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={toggleMetronome}
                        className="btn-icon"
                        style={{
                            width: '44px',
                            height: '44px',
                            backgroundColor: playing ? 'var(--color-danger-red)' : 'var(--color-brand-blue)',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            transition: 'all 0.2s'
                        }}
                        title={playing ? 'Pausar' : 'Reproducir'}
                    >
                        {playing ? <PauseIcon /> : <PlayIcon />}
                    </button>

                    <button
                        onClick={() => setSubdivision(!subdivision)}
                        className="btn-icon"
                        style={{
                            width: '44px',
                            height: '44px',
                            backgroundColor: subdivision ? 'var(--color-brand-blue)' : 'var(--color-ui-surface)',
                            color: subdivision ? 'white' : 'var(--color-ui-text)',
                            border: '1px solid var(--color-border-subtle)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s'
                        }}
                        title="Corcheas"
                    >
                        <MusicNoteIcon color="currentColor" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            right: '24px',
            bottom: '100px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
        }}>
            <div
                onClick={toggleMetronome}
                style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-brand-blue)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    transition: 'transform 0.1s',
                    border: 'none'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <span className="text-overline" style={{
                    fontSize: '11px',
                    color: 'white',
                    fontWeight: 'bold',
                    lineHeight: 1,
                    marginBottom: '4px'
                }}>BPM</span>
                {playing ? <PauseIcon /> : <PlayIcon />}
            </div>

            <button
                onClick={() => setSubdivision(!subdivision)}
                className="btn-icon"
                style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: subdivision ? 'var(--color-brand-blue)' : 'var(--color-ui-surface)',
                    color: subdivision ? 'white' : 'var(--color-ui-text)',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s'
                }}
                title="Corcheas"
            >
                <MusicNoteIcon color="currentColor" />
            </button>
        </div>
    );
};
