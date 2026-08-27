import { useEffect } from 'react';

/**
 * Publishes the rendered height of the sticky year header as `--year-header-h`
 * on the document root, so the issue headers can pin themselves directly below
 * it.
 *
 * This is measured rather than hardcoded on purpose: the header's height is the
 * sum of a font-size in `em`, padding, and the reader's own font settings, and
 * the last hardcoded guess (36px) silently went stale the moment the heading
 * grew. A CSS `calc()` can't stand in either — `em` there resolves against the
 * parent's font-size, not the heading's.
 */
export default function useStickyHeaderHeight(
    /**
     * Changes whenever the rendered sections do, so the hook re-queries instead
     * of holding on to a header React has since detached — an observer on a
     * removed node goes quiet, which would freeze the variable at a stale value.
     */
    key: unknown,
    selector = '.year-section-title'
) {
    useEffect(() => {
        const header = document.querySelector(selector);
        if (!header || typeof ResizeObserver === 'undefined') {
            return;
        }

        const publish = () => {
            document.documentElement.style.setProperty(
                '--year-header-h',
                `${Math.round(header.getBoundingClientRect().height)}px`
            );
        };

        publish();

        const observer = new ResizeObserver(publish);
        observer.observe(header);
        return () => observer.disconnect();
    }, [key, selector]);
}
