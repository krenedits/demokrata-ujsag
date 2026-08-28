/// <reference types="vitest" />
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, Plugin } from 'vite';

const SITE_URL = 'https://krenedits.github.io/demokrata-ujsag/';
const SITE_TITLE = 'Demokrata Újság Archívum';

// GitHub Pages has no server-side SPA rewrite: a direct hit on /demokrata-ujsag/1993
// is a static-file lookup that misses and falls through to 404.html. Serving a copy
// of index.html from there lets the app boot and route the path client-side.
//
// That fallback is enough for a browser, but Pages serves 404.html with an actual
// HTTP 404, so a crawler drops the year URLs the sitemap advertises. The years are
// known at build time, so emit a real dist/<year>/index.html for each one: Pages
// serves those with a 200, and stamping the year into the title/canonical/OG tags
// means a crawler that never runs the bundle still reads the right metadata.
const staticRoutes = (outDir: string): Plugin => ({
    name: 'static-year-routes',
    apply: 'build',
    closeBundle() {
        const indexPath = resolve(outDir, 'index.html');
        copyFileSync(indexPath, resolve(outDir, '404.html'));

        const html = readFileSync(indexPath, 'utf8');
        const fileList = JSON.parse(
            readFileSync(resolve(__dirname, 'src/fileList.json'), 'utf8')
        );
        const years = Object.keys(fileList).sort();

        for (const year of years) {
            const title = `${year} — ${SITE_TITLE}`;
            // Trailing slash to match how Pages actually serves <year>/index.html,
            // and to match scripts/generateSitemap.js and useCanonicalUrl.
            const url = `${SITE_URL}${year}/`;
            const yearHtml = html
                .replace(
                    /<title>[^<]*<\/title>/,
                    `<title>${title}</title>`
                )
                .replace(
                    /(<link rel="canonical" href=")[^"]*(")/,
                    `$1${url}$2`
                )
                .replace(
                    /(<meta property="og:title" content=")[^"]*(")/,
                    `$1${title}$2`
                )
                .replace(
                    /(<meta property="og:url" content=")[^"]*(")/,
                    `$1${url}$2`
                )
                .replace(
                    /(<meta name="twitter:title" content=")[^"]*(")/,
                    `$1${title}$2`
                );

            mkdirSync(resolve(outDir, year), { recursive: true });
            writeFileSync(resolve(outDir, year, 'index.html'), yearHtml);
        }

        console.log(
            `static-year-routes: 404.html + ${years.length} year pages emitted`
        );
    },
});

// https://vite.dev/config/
export default defineConfig(() => {
    const outDir = 'dist';

    return {
        base: '/demokrata-ujsag/', // GitHub Pages subpath
        build: { outDir },
        plugins: [react(), staticRoutes(outDir)],
        // Two React instances in one graph is a recurring failure here: it has
        // crashed the dev server ("Cannot read properties of null (reading
        // 'useState')") and made a test suite fail to collect
        // ("React.createContext is not a function") while passing on its own.
        // Deduping pins every importer to the same copy.
        resolve: { dedupe: ['react', 'react-dom'] },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: './src/test/setup.ts',
        },
    };
});
