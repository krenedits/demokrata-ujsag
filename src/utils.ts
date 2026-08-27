export const prefersReducedMotion = (): boolean =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// fileList paths are root-relative ("/images/1989/…"), so they need the deploy
// base prepended. Resolving them against the base rather than with a "./"
// prefix matters now that routes are real paths: on "/demokrata-ujsag/1993/"
// a relative "./images/…" would resolve under the year segment and 404.
export const assetUrl = (path: string): string =>
    `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
