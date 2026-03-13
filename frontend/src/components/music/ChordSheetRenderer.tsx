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
    // 1. Safety check for empty content
    if (!content || !content.trim()) {
        return <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5, fontStyle: 'italic' }}>Sin contenido de letra o acordes.</div>;
    }

    // 2. Sanitize content (close unclosed brackets on each line to avoid parser crash while typing)
    const sanitizedContent = content.split('\n').map((line: string) => {
        let openCount = 0;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '[') openCount++;
            if (line[i] === ']') openCount--;
        }
        
        // If there's an unclosed bracket, close it
        let fixedLine = openCount > 0 ? line + ']'.repeat(openCount) : line;
        
        // Fix for Section Tags: If the line is EXACTLY a bracketed tag like [intro], [coro]
        // convert it to a comment directive {c: tag} so it doesn't create an empty lyrics line below.
        const trimmed = fixedLine.trim();
        const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
        if (sectionMatch) {
            const tag = sectionMatch[1].trim();
            const sectionKeywords = ['intro', 'coro', 'verse', 'verso', 'estrofa', 'puente', 'bridge', 'solo', 'final', 'outro', 'instrumental', 'interlude', 'coda', 'pre-coro', 'pre-chorus', 'estribillo', 'parte'];
            const isKeyword = sectionKeywords.some(k => tag.toLowerCase().includes(k));
            
            // If it's a known keyword OR longer than a typical chord
            if (isKeyword || (tag.length > 4 && !/^[A-G][b#]?(m|maj|min|dim|aug)?[0-9]?/.test(tag))) {
                return `{c: ${tag}}`;
            }
        }

        // Special case: "[]" (empty brackets) also crash many ChordPro parsers.
        // We remove them or add a space to make them valid [ ].
        return fixedLine.replace(/\[\]/g, '[ ]');
    }).join('\n');

    // 3. Parse explicitly as ChordPro with safety check
    let song: any;
    try {
        const parser = new ChordProParser();
        song = parser.parse(sanitizedContent);
    } catch (e) {
        console.warn('ChordSheetJS parsing error:', e);
        return (
            <div className="chord-sheet-container">
                <div style={{ 
                    padding: '16px', 
                    backgroundColor: 'rgba(239, 68, 68, 0.05)', 
                    borderRadius: '8px', 
                    border: '1px dashed rgba(239, 68, 68, 0.3)',
                    color: '#EF4444',
                    fontSize: '12px',
                    marginBottom: '16px'
                }}>
                    <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '8px', fontSize: '18px' }}>warning</span>
                    Error al procesar acordes. Revisa que todos los corchetes [ ] estén cerrados.
                </div>
                <pre style={{ whiteSpace: 'pre-wrap', fontStyle: 'italic', opacity: 0.7 }}>{content}</pre>
            </div>
        );
    }

    // 4. Calculate Current Key
    const currentKey = musicUtils.transposeNote(songKey, transpose);

    // 5. Transform Chords in the song object tree
    song.lines.forEach((line: any) => {
        line.items.forEach((item: any) => {
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
            font-weight: bold;
            color: var(--color-brand-blue);
            margin-bottom: 8px;
            display: block;
            text-transform: uppercase;
            font-size: 0.85em;
            opacity: 0.8;
            border-bottom: 1px solid var(--color-border-subtle);
            padding-bottom: 2px;
        }

    `;

    return (
        <div className="chord-sheet-container">
            <style>{styles}</style>
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
};
