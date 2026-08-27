import { useEffect } from 'react';

const SITE_TITLE = 'Demokrata Újság Archívum';

// Must match scripts/generateSitemap.js — the sitemap advertises each year as a
// distinct URL, so the canonical each of those pages declares has to agree.
const SITE_ORIGIN = 'https://krenedits.github.io';

/**
 * Reflects the current view in the tab/history title. `detail` is the part that
 * varies (a year, an open page); pass undefined for the plain site title.
 */
export default function useDocumentTitle(detail: string | undefined) {
    useEffect(() => {
        document.title = detail ? `${detail} — ${SITE_TITLE}` : SITE_TITLE;
    }, [detail]);
}

/**
 * Points the canonical link at the current view. index.html ships a static one
 * for the root; left alone it would tell crawlers that every year page is a
 * duplicate of the root, undoing the sitemap.
 *
 * `path` is relative to the deploy base — "" for the root, "1993" for a year.
 * A year gets a trailing slash: it is published as <year>/index.html, and Pages
 * 301s the slash-less form to it. Advertising the pre-redirect URL would make
 * every sitemap entry a redirect hop.
 */
export function useCanonicalUrl(path: string) {
    useEffect(() => {
        let link = document.querySelector<HTMLLinkElement>(
            'link[rel="canonical"]'
        );
        if (!link) {
            link = document.createElement('link');
            link.rel = 'canonical';
            document.head.appendChild(link);
        }
        const suffix = path ? `${path}/` : '';
        link.href = `${SITE_ORIGIN}${import.meta.env.BASE_URL}${suffix}`;
    }, [path]);
}

export { SITE_TITLE };
