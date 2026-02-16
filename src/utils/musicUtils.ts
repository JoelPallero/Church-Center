const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Keys that usually use flats
const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm'];

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export const musicUtils = {
    getSemitoneIndex: (note: string): number => {
        const root = note.match(/^([A-G][#b]?)/)?.[1] || '';
        let idx = NOTES_SHARP.indexOf(root);
        if (idx === -1) idx = NOTES_FLAT.indexOf(root);
        return idx;
    },

    transposeNote: (note: string, semitones: number, targetKey?: string): string => {
        if (!note) return '';
        if (note.includes('/')) {
            return note.split('/').map(n => musicUtils.transposeNote(n, semitones, targetKey)).join('/');
        }

        const match = note.match(/^([A-G][#b]?)(.*)$/);
        if (!match) return note;

        const root = match[1];
        const quality = match[2];
        const idx = musicUtils.getSemitoneIndex(root);
        if (idx === -1) return note;

        let newIdx = (idx + semitones) % 12;
        while (newIdx < 0) newIdx += 12;

        const useFlats = targetKey ? FLAT_KEYS.includes(targetKey) : FLAT_KEYS.includes(root);
        return (useFlats ? NOTES_FLAT[newIdx] : NOTES_SHARP[newIdx]) + quality;
    },

    toRoman: (chord: string, key: string): string => {
        if (!chord || !key) return chord;

        // Handle slash chords
        let bass = '';
        let originalMain = chord;
        if (chord.includes('/')) {
            [originalMain, bass] = chord.split('/');
            bass = '/' + musicUtils.toRoman(bass, key);
        }

        const chordIdx = musicUtils.getSemitoneIndex(originalMain);
        const keyIdx = musicUtils.getSemitoneIndex(key);
        if (chordIdx === -1 || keyIdx === -1) return chord;

        let interval = (chordIdx - keyIdx) % 12;
        while (interval < 0) interval += 12;

        // Quality of the chord
        const isMinor = originalMain.includes('m') && !originalMain.includes('maj');
        const isDim = originalMain.includes('dim') || originalMain.includes('°');

        let roman = '';
        let accidental = '';

        // Match interval to scale degree
        const degreeIndex = MAJOR_INTERVALS.indexOf(interval);
        if (degreeIndex !== -1) {
            roman = ROMAN_NUMERALS[degreeIndex];
        } else {
            // Chromatic notes
            if (interval === 1) { roman = 'II'; accidental = 'b'; }
            else if (interval === 3) { roman = 'III'; accidental = 'b'; }
            else if (interval === 6) { roman = 'IV'; accidental = '#'; }
            else if (interval === 8) { roman = 'VI'; accidental = 'b'; }
            else if (interval === 10) { roman = 'VII'; accidental = 'b'; }
            else roman = originalMain;
        }

        if (isMinor) roman = roman.toLowerCase();
        if (isDim) roman += '°';

        // Strip the 'm' from quality if we already made roman lowercase
        const cleanQuality = originalMain.replace(/^([A-G][#b]?)/, '').replace(/^m/, '');

        return accidental + roman + cleanQuality + bass;
    },

    toSolfege: (note: string): string => {
        const solfegeMap: Record<string, string> = {
            'C': 'Do', 'C#': 'Do#', 'Db': 'Reb',
            'D': 'Re', 'D#': 'Re#', 'Eb': 'Mib',
            'E': 'Mi',
            'F': 'Fa', 'F#': 'Fa#', 'Gb': 'Solb',
            'G': 'Sol', 'G#': 'Sol#', 'Ab': 'Lab',
            'A': 'La', 'A#': 'La#', 'Bb': 'Sib',
            'B': 'Si'
        };

        const translate = (n: string) => {
            const root = n.match(/^([A-G][#b]?)/)?.[1] || '';
            const rest = n.slice(root.length);
            return (solfegeMap[root] || root) + rest;
        };

        if (note.includes('/')) {
            return note.split('/').map(translate).join('/');
        }
        return translate(note);
    }
};
