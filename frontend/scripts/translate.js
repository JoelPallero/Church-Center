/**
 * Utility to sync translation files (JSON) based on es.json as master.
 * Usage: node translate.js
 */
const fs = require('fs');
const path = require('path');

const localesDir = './src/i18n/locales';
const masterFile = path.join(localesDir, 'es.json');
const targetFiles = ['en.json', 'pt.json'].map(f => path.join(localesDir, f));

const master = JSON.parse(fs.readFileSync(masterFile, 'utf8'));

targetFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    // Recursive sync
    const sync = (src, dest) => {
        Object.keys(src).forEach(key => {
            if (typeof src[key] === 'object' && src[key] !== null) {
                if (!dest[key] || typeof dest[key] !== 'object') dest[key] = {};
                sync(src[key], dest[key]);
            } else {
                if (dest[key] === undefined) {
                    dest[key] = `[TODO: ${src[key]}]`; // Mark for translation
                }
            }
        });

        // Remove keys not in master
        Object.keys(dest).forEach(key => {
            if (src[key] === undefined) delete dest[key];
        });
    };

    sync(master, data);

    // Sort keys like master for consistency
    const sort = (obj, ref) => {
        const sorted = {};
        Object.keys(ref).forEach(key => {
            if (typeof ref[key] === 'object' && ref[key] !== null) {
                sorted[key] = sort(data[key], ref[key]);
            } else {
                sorted[key] = obj[key];
            }
        });
        return sorted;
    };

    const result = sort(data, master);
    fs.writeFileSync(file, JSON.stringify(result, null, 4), 'utf8');
    console.log(`Synced ${path.basename(file)}`);
});
