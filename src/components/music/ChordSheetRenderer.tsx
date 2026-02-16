import type { FC } from 'react';
import { ChordProParser, HtmlDivFormatter } from 'chordsheetjs';
import { musicUtils } from '../../utils/musicUtils';

export type ChordViewMode = 'american' | 'spanish' | 'roman' | 'lyrics';

interface ChordSheetRendererProps {
    content: string;
    transpose: number;
    viewMode: ChordViewMode;
    songKey: string;
    fontSize?: number;
}

export const ChordSheetRenderer: FC<ChordSheetRendererProps> = ({
    content,
    transpose,
    viewMode,
    songKey,
    fontSize = 16
}) => {
    // 1. Parse explicitly as ChordPro
    const parser = new ChordProParser();
    const song = parser.parse(content);

    // 2. Calculate Current Key
    const currentKey = musicUtils.transposeNote(songKey, transpose);

    // 3. Transform Chords in the song object tree
    song.lines.forEach(line => {
        line.items.forEach(item => {
            // Use property check instead of instanceof for better resilience with different versions/bundling
            if (typeof item === 'object' && item !== null && 'chords' in item && item.chords) {
                const chordItem = item as any;
                // Determine transposed chord first
                let processedChord = musicUtils.transposeNote(chordItem.chords, transpose, currentKey);

                // Apply view mode transformation
                if (viewMode === 'roman') {
                    processedChord = musicUtils.toRoman(processedChord, currentKey);
                } else if (viewMode === 'spanish') {
                    processedChord = musicUtils.toSolfege(processedChord);
                }

                // Update the chord in the object
                chordItem.chords = processedChord;
            }
        });
    });

    // 4. Format to HTML
    const formatter = new HtmlDivFormatter();
    const html = formatter.format(song);

    // 5. CSS for hiding chords and styling
    const styles = `
        .chord-sheet-container {
            font-family: 'Roboto Mono', monospace;
            font-size: ${fontSize}px;
            line-height: normal;
            color: var(--color-ui-text);
        }
        .chord-sheet-container .paragraph {
            margin-bottom: 32px;
        }
        .chord-sheet-container .row {
            display: flex;
            flex-wrap: wrap;
            margin-bottom: 16px;
        }
        .chord-sheet-container .column {
            display: flex;
            flex-direction: column;
            margin-right: 0;
        }
        .chord-sheet-container .chord {
            color: var(--color-brand-blue);
            font-weight: bold;
            height: 1.5em;
            padding-top: 4px;
            display: ${viewMode === 'lyrics' ? 'none' : 'block'};
        }
        .chord-sheet-container .lyrics {
            min-height: 1.25em;
            white-space: pre;
        }
        .chord-sheet-container .comment {
            font-style: italic;
            color: gray;
            margin-bottom: 12px;
            display: block;
        }
    `;

    return (
        <div className="chord-sheet-container">
            <style>{styles}</style>
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
};
