// Regenerates public/sitemap.xml from the archive's year list.
// Runs as part of `yarn build` (see package.json) so it can't drift out of sync
// with fileList.json.
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const SITE_ORIGIN = 'https://krenedits.github.io';
const BASE_PATH = '/demokrata-ujsag/';
const BASE_URL = `${SITE_ORIGIN}${BASE_PATH}`;

const fileList = JSON.parse(
    readFileSync(resolve(root, 'src/fileList.json'), 'utf8')
);

const years = Object.keys(fileList).sort();

// The root browses everything; each year is its own filtered view, which is
// what makes it worth listing separately.
// Trailing slash: each year ships as <year>/index.html, and Pages 301s the
// slash-less form to it — advertising that would make every entry a redirect.
const urls = [
    { loc: BASE_URL, priority: '1.0' },
    ...years.map((year) => ({ loc: `${BASE_URL}${year}/`, priority: '0.8' })),
];

const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
        ({ loc, priority }) =>
            `    <url>\n        <loc>${loc}</loc>\n        <priority>${priority}</priority>\n    </url>`
    ),
    '</urlset>',
    '',
].join('\n');

writeFileSync(resolve(root, 'public/sitemap.xml'), xml);

console.log(`sitemap.xml written: ${urls.length} URLs (${years.length} years)`);
