<?php
/**
 * MusicTheory Utility (Refactored)
 * Handles ChordPro parsing and basic music theory operations.
 */

class MusicTheory
{
    private static $notes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

    // Mapping for enharmonics to simplify transposition
    private static $enharmonics = [
        'C#' => 'Db',
        'D#' => 'Eb',
        'F#' => 'Gb',
        'G#' => 'Ab',
        'A#' => 'Bb',
        'Db' => 'Db',
        'Eb' => 'Eb',
        'Gb' => 'Gb',
        'Ab' => 'Ab',
        'Bb' => 'Bb'
    ];

    /**
     * Transpose a single note
     */
    public static function transposeNote($note, $semitones)
    {
        if (empty($note))
            return '';

        // Handle chords like Dm7, Gsus4
        $root = '';
        $suffix = '';

        if (strlen($note) > 1 && ($note[1] === '#' || $note[1] === 'b')) {
            $root = substr($note, 0, 2);
            $suffix = substr($note, 2);
        } else {
            $root = substr($note, 0, 1);
            $suffix = substr($note, 1);
        }

        // Normalize root
        $normalizedRoot = self::$enharmonics[$root] ?? $root;

        $index = array_search($normalizedRoot, self::$notes);
        if ($index === false)
            return $note; // Not a recognized note

        $newIndex = ($index + $semitones + 12) % 12;
        return self::$notes[$newIndex] . $suffix;
    }

    /**
     * Detect Key from ChordPro content
     */
    public static function detectKey($content)
    {
        $chords = self::extractChords($content);
        if (empty($chords))
            return 'C';

        // Simple algorithm: most frequent chord (usually tonic)
        $counts = array_count_values($chords);
        arsort($counts);
        return key($counts);
    }

    /**
     * Extract chords from ChordPro string [C]Amazing [G]Grace...
     */
    public static function extractChords($content)
    {
        preg_match_all('/\[([^\]]+)\]/', $content, $matches);
        return $matches[1] ?? [];
    }

    /**
     * Transpose ChordPro content
     */
    public static function transposeContent($content, $semitones)
    {
        if ($semitones === 0)
            return $content;

        return preg_replace_callback('/\[([^\]]+)\]/', function ($matches) use ($semitones) {
            $chord = $matches[1];
            // Handle slash chords like D/F#
            if (strpos($chord, '/') !== false) {
                $parts = explode('/', $chord);
                $newParts = array_map(function ($p) use ($semitones) {
                    return self::transposeNote(trim($p), $semitones);
                }, $parts);
                return '[' . implode('/', $newParts) . ']';
            }
            return '[' . self::transposeNote($chord, $semitones) . ']';
        }, $content);
    }
}
?>