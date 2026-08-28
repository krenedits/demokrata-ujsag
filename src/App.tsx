import { useState } from 'react';
import { Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import './App.css';
import ImageGallery from './components/ImageGallery';
import SiteHeader from './components/SiteHeader';

function GalleryPage() {
    const [searchParams] = useSearchParams();
    const hasActiveFilters =
        !!searchParams.get('author') ||
        !!searchParams.get('title') ||
        !!searchParams.get('q');

    // Search is a place you go, not the first thing the archive asks of you —
    // except when the visitor arrived on a shared, already-filtered link, where
    // hiding the filters would leave them looking at a narrowed archive with no
    // sign of why.
    const [isSearchOpen, setIsSearchOpen] = useState(hasActiveFilters);

    return (
        <>
            <SiteHeader
                isSearchOpen={isSearchOpen}
                onToggleSearch={() => setIsSearchOpen((open) => !open)}
                hasActiveFilters={hasActiveFilters}
            />

            <div className="site-hint">
                <div className="shell">
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--gold-deep)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        aria-hidden="true"
                    >
                        <circle cx="12" cy="12" r="9.2" />
                        <path d="M12 11 L12 16.6" />
                        <path d="M12 7.6 L12 7.8" />
                    </svg>
                    <div>
                        <p>
                            Válasszon egy évszámot, majd kattintson bármelyik oldalra
                            &ndash; a lap teljes méretben megnyílik, és tetszés szerint
                            nagyítható.
                        </p>
                        <details className="about">
                            <summary>Mi ez az oldal?</summary>
                            <p>
                                A Demokrata Újság 1989 októberétől 1998-ig jelent meg
                                Veresegyházon, a Magyar Demokrata Fórum helyi
                                csoportjának kiadásában. Minden lapszám minden oldala
                                beszkennelve, teljes szövegében kereshetően olvasható
                                itt, és eredeti méretben le is tölthető.
                            </p>
                        </details>
                    </div>
                </div>
            </div>

            <ImageGallery
                isSearchOpen={isSearchOpen}
                onCloseSearch={() => setIsSearchOpen(false)}
            />

            <footer className="site-footer">
                <div className="shell">
                    <p>
                        A lapszámokat a veresegyházi közösség digitalizálta. Az oldalak
                        eredeti méretben letölthetők.
                    </p>
                </div>
            </footer>
        </>
    );
}

function App() {
    return (
        <Routes>
            {/* "/" browses every year; "/:year" narrows to one. An unknown year
                is a single segment, so it matches ":year" rather than "*" — the
                gallery redirects those itself. */}
            <Route path="/" element={<GalleryPage />} />
            <Route path="/:year" element={<GalleryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
