import { useCallback, useEffect, useState } from 'react';
import fileList from '../fileList.json';
import { assetUrl } from '../utils';

const TEXT_SIZE_KEY = 'demokrata:textsize';

const totals = (() => {
    let issues = 0;
    let pages = 0;
    for (const releases of Object.values(fileList)) {
        const entries = Object.values(releases as Record<string, unknown[]>);
        issues += entries.length;
        for (const images of entries) {
            pages += images.length;
        }
    }
    const years = Object.keys(fileList);
    return { issues, pages, from: years[0], to: years[years.length - 1] };
})();

/**
 * The page-wide type scale, on <html> so every `calc(... * var(--scale))` in the
 * stylesheets follows it. Kept in localStorage because a reader who needs it
 * needs it on every visit, and reading the stored value before the first paint
 * would otherwise flash the small size.
 */
const useTextSize = () => {
    const [isLarge, setIsLarge] = useState(false);

    useEffect(() => {
        try {
            setIsLarge(window.localStorage.getItem(TEXT_SIZE_KEY) === 'large');
        } catch {
            // Private mode, or storage disabled: the default size still works.
        }
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        if (isLarge) {
            root.dataset.textsize = 'large';
        } else {
            delete root.dataset.textsize;
        }
    }, [isLarge]);

    const toggle = useCallback(() => {
        setIsLarge((previous) => {
            const next = !previous;
            try {
                window.localStorage.setItem(TEXT_SIZE_KEY, next ? 'large' : 'normal');
            } catch {
                // Not being able to remember it is not a reason to refuse it now.
            }
            return next;
        });
    }, []);

    return { isLarge, toggle };
};

interface SiteHeaderProps {
    isSearchOpen: boolean;
    onToggleSearch: () => void;
    hasActiveFilters: boolean;
}

export default function SiteHeader({
    isSearchOpen,
    onToggleSearch,
    hasActiveFilters,
}: SiteHeaderProps) {
    const { isLarge, toggle } = useTextSize();

    return (
        <>
            <header className="site-header">
                <div className="shell">
                    <h1 className="masthead">
                        <img
                            className="masthead-crest"
                            src={assetUrl('/logo.svg')}
                            alt=""
                            aria-hidden="true"
                            width="48"
                            height="71"
                        />
                        <span className="masthead-text">
                            <span className="masthead-name">Demokrata Újság</span>
                            <span className="masthead-eyebrow">
                                ARCHÍVUM &middot; VERESEGYHÁZ &middot; {totals.from}&ndash;{totals.to}
                            </span>
                        </span>
                    </h1>

                    <div className="header-actions">
                        <button
                            type="button"
                            onClick={toggle}
                            aria-pressed={isLarge}
                        >
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.1"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M3 19 L8.5 5 L14 19" />
                                <path d="M5 14.5 L12 14.5" />
                                <path d="M15.5 19 L19 10 L22.5 19" />
                                <path d="M16.6 16 L21.4 16" />
                            </svg>
                            Nagyobb betűk
                        </button>

                        <button
                            type="button"
                            onClick={onToggleSearch}
                            aria-expanded={isSearchOpen}
                            aria-controls="kereses-panel"
                        >
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                aria-hidden="true"
                            >
                                <circle cx="11" cy="11" r="7" />
                                <path d="M16.2 16.2 L21 21" />
                            </svg>
                            Keresés
                            {hasActiveFilters && (
                                <span className="visually-hidden">(szűrés aktív)</span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <div className="site-meta">
                <div className="shell">
                    <span>A Magyar Demokrata Fórum veresegyházi csoportjának lapja</span>
                    <span>
                        {totals.issues} lapszám &middot; {totals.pages} oldal
                    </span>
                </div>
            </div>
        </>
    );
}
