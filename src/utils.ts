// Guarded because this is now read during render (the viewer's zoom transition),
// not just from event handlers: matchMedia is absent in jsdom and any
// non-browser context, and an unguarded call there takes the whole tree down.
export const prefersReducedMotion = (): boolean =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false;

// fileList paths are root-relative ("/images/1989/…"), so they need the deploy
// base prepended. Resolving them against the base rather than with a "./"
// prefix matters now that routes are real paths: on "/demokrata-ujsag/1993/"
// a relative "./images/…" would resolve under the year segment and 404.
export const assetUrl = (path: string): string =>
    `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
