import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatVersionLabel, parseImagePath, typedFileList } from './utils';
import { assetUrl } from '../../utils';
import { ImageEntry } from '../../types';
import { MAX_SCALE, MIN_SCALE, useZoomPan } from './useZoomPan';

interface FullSizeImageProps {
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    selectedYear: string | undefined;
}

type PageEvent = React.MouseEvent | React.PointerEvent | KeyboardEvent;

/** The ratio of all but one scan; corrected from the real file once it loads. */
const DEFAULT_ASPECT = '1275 / 1755';
const DEFAULT_RATIO = 1275 / 1755;
/** Matches the <source media> below: the only case where the WebP is chosen. */
const WEBP_MEDIA = '(max-width: 960px)';
/**
 * The .scan-full opacity transition in ImageGallery.css is 200ms; the extra
 * 60ms is slack, because a bare 200ms timer beat the compositor by a frame and
 * left one frame at 0.988 opacity with nothing behind it (measured).
 */
const LQIP_RETIRE_MS = 260;
/**
 * How long a zoom has to settle before it's announced. A wheel scroll or a pinch
 * emits dozens of scale changes; announcing each would queue dozens of
 * utterances for one continuous gesture and bury whatever came before.
 */
const ZOOM_ANNOUNCE_MS = 500;

const webpFor = (image: string) => image.replace(/\.jpe?g$/i, '_m.webp');

interface ZoomKeys {
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
}

const usePageScroll = (
    isOpen: boolean,
    setSelectedImage: (image: string | null) => void,
    handlePrevious: (e: PageEvent) => void,
    handleNext: (e: PageEvent) => void,
    handleFirst: (e: PageEvent) => void,
    handleLast: (e: PageEvent) => void,
    zoom: ZoomKeys
) => {
    useEffect(() => {
        // Without this guard the listener stays live on the plain gallery,
        // where Escape would "close" an already-closed viewer and push a
        // duplicate history entry each press, deadening the Back button.
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd +, - and 0 are the browser's own page zoom, and on an
            // archive of scanned text that's a real accessibility affordance.
            // Claiming them for the image zoom would take it away.
            if (e.ctrlKey || e.metaKey || e.altKey) {
                return;
            }
            // Only the keys the viewer actually acts on are swallowed — Tab has
            // to keep reaching the focus trap, and everything else stays
            // available for the browser's own shortcuts. Without this, Home/End
            // and the arrows also scroll the gallery behind the fixed modal.
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                handlePrevious(e);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNext(e);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setSelectedImage(null);
            } else if (e.key === 'Home') {
                e.preventDefault();
                handleFirst(e);
            } else if (e.key === 'End') {
                e.preventDefault();
                handleLast(e);
            } else if (e.key === '+' || e.key === '=') {
                // "=" is the unshifted key that carries "+" on most layouts.
                e.preventDefault();
                zoom.zoomIn();
            } else if (e.key === '-') {
                e.preventDefault();
                zoom.zoomOut();
            } else if (e.key === '0') {
                e.preventDefault();
                zoom.resetZoom();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handlePrevious, handleNext, handleFirst, handleLast, setSelectedImage, zoom]);
};

/** Stops the gallery scrolling underneath the fixed-position viewer. */
const useBodyScrollLock = (isOpen: boolean) => {
    useEffect(() => {
        if (!isOpen) {
            return;
        }
        // Restore the previous inline value rather than clearing it outright,
        // so an overflow set elsewhere survives the viewer opening and closing.
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [isOpen]);
};

const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function FullSizeImage({
    selectedImage,
    setSelectedImage,
    selectedYear,
}: FullSizeImageProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);
    const wasOpenRef = useRef(false);
    const currentYear = selectedYear ? typedFileList[selectedYear] : undefined;

    const { release: selectedRelease, page: selectedPage, version: selectedVersion } = selectedImage ? parseImagePath(selectedImage) : { release: '', page: '', version: '' };

    const currentRelease = currentYear?.[selectedRelease] as ImageEntry[] | undefined;

    const currentIndex = currentRelease ? currentRelease.findIndex((image) => image.image === selectedImage) : -1;
    const currentEntry = currentIndex >= 0 ? currentRelease?.[currentIndex] : undefined;
    const isPreviousDisabled = !selectedYear || !currentRelease || currentIndex <= 0;
    const isNextDisabled = !selectedYear || !currentRelease || currentIndex === currentRelease.length - 1;
    const nextImageEntry = currentRelease && currentIndex < currentRelease.length - 1
        ? currentRelease[currentIndex + 1]
        : undefined;

    // 8 of the 545 pages have no thumbnail, so the placeholder is genuinely
    // optional and the spinner below is a real branch, not a theoretical one.
    const thumbnail = currentEntry?.image_k;

    const [isFullLoaded, setIsFullLoaded] = useState(false);
    const [aspect, setAspect] = useState<string>(DEFAULT_ASPECT);
    // Feeds the pan bounds: the viewport box isn't always the scan's shape, so
    // the hook needs the real ratio to know where the rendered image ends.
    const [ratio, setRatio] = useState<number>(DEFAULT_RATIO);
    // The placeholder outlives `isFullLoaded` by one fade, so the panel never
    // shows through while the scan is still transparent.
    const [isLqipRetired, setIsLqipRetired] = useState(false);
    const [isFullResReady, setIsFullResReady] = useState(false);
    // A <picture> does NOT fall back to the <img src> when its chosen <source>
    // 404s — verified in Chrome: the element keeps the missing WebP as its
    // currentSrc with naturalWidth 0, and the viewport renders blank. Dropping
    // the <source> is what makes the browser re-resolve to the original JPEG.
    const [hasWebpFailed, setHasWebpFailed] = useState(false);

    const handleFirst = useCallback((e: PageEvent) => {
        e.stopPropagation();
        const first = currentRelease?.[0];
        if (first) {
            setSelectedImage(first.image);
        }
    }, [currentRelease, setSelectedImage]);

    const handleLast = useCallback((e: PageEvent) => {
        e.stopPropagation();
        const last = currentRelease?.[currentRelease.length - 1];
        if (last) {
            setSelectedImage(last.image);
        }
    }, [currentRelease, setSelectedImage]);

    // The paging rules live here, event-free, so the buttons, the keyboard and
    // the swipe gesture all go through one definition of "what is the next
    // page" — including the boundaries, which simply yield no entry.
    const goPrevious = useCallback(() => {
        const prev = currentIndex > 0 ? currentRelease?.[currentIndex - 1] : undefined;
        if (prev) {
            setSelectedImage(prev.image);
        }
    }, [currentIndex, currentRelease, setSelectedImage]);

    const goNext = useCallback(() => {
        if (nextImageEntry) {
            setSelectedImage(nextImageEntry.image);
        }
    }, [nextImageEntry, setSelectedImage]);

    const handlePrevious = useCallback(
        (e: PageEvent) => {
            e.stopPropagation();
            goPrevious();
        },
        [goPrevious]
    );

    const handleNext = useCallback(
        (e: PageEvent) => {
            e.stopPropagation();
            goNext();
        },
        [goNext]
    );

    const {
        scale,
        isZoomed,
        isDragging,
        setTarget,
        zoomIn,
        zoomOut,
        reset,
        style,
        handlers,
    } = useZoomPan({
        resetKey: selectedImage,
        contentRatio: ratio,
        onSwipeLeft: goNext,
        onSwipeRight: goPrevious,
    });

    const zoomKeys = useMemo(
        () => ({ zoomIn, zoomOut, resetZoom: reset }),
        [zoomIn, zoomOut, reset]
    );

    usePageScroll(
        !!selectedImage,
        setSelectedImage,
        handlePrevious,
        handleNext,
        handleFirst,
        handleLast,
        zoomKeys
    );
    useBodyScrollLock(!!selectedImage);

    // The visible readout updates every frame of a gesture; the announcement
    // waits for the gesture to stop, so a screen reader says the level once
    // rather than reading out the whole path there.
    const zoomPercent = Math.round(scale * 100);
    const [announcedZoom, setAnnouncedZoom] = useState(zoomPercent);
    useEffect(() => {
        if (announcedZoom === zoomPercent) {
            return;
        }
        const timer = window.setTimeout(
            () => setAnnouncedZoom(zoomPercent),
            ZOOM_ANNOUNCE_MS
        );
        return () => window.clearTimeout(timer);
    }, [zoomPercent, announcedZoom]);

    // Fresh page: the previous scan's loaded/decoded flags must not leak, or
    // the new one renders as "already loaded" and skips its placeholder.
    useEffect(() => {
        setIsFullLoaded(false);
        setIsLqipRetired(false);
        setIsFullResReady(false);
        setHasWebpFailed(false);
        setAspect(DEFAULT_ASPECT);
        setRatio(DEFAULT_RATIO);
    }, [selectedImage]);

    /**
     * Unmounting the placeholder the instant the scan reports loaded flashed the
     * bare panel through the viewport for the whole 200ms fade — on every page
     * turn, which is the one thing a placeholder exists to prevent. It stays
     * underneath until the scan is actually opaque.
     */
    useEffect(() => {
        if (!isFullLoaded) {
            return;
        }
        const timer = window.setTimeout(() => setIsLqipRetired(true), LQIP_RETIRE_MS);
        return () => window.clearTimeout(timer);
    }, [isFullLoaded, selectedImage]);

    // Preload next image
    useEffect(() => {
        if (nextImageEntry) {
            const nextImage = new Image();
            nextImage.src = assetUrl(nextImageEntry.image);
        }
    }, [nextImageEntry]);

    /**
     * Below 960px the <picture> serves the 960px WebP, which is a quarter of the
     * scan's detail — fine at fit, useless once magnified to read body text. So
     * on zoom we fetch the original and only stack it on top once it has
     * decoded, which keeps the swap free of any flash.
     */
    useEffect(() => {
        if (!selectedImage || !isZoomed || isFullResReady) {
            return;
        }
        if (!window.matchMedia(WEBP_MEDIA).matches) {
            // Desktop already has the original on screen; nothing to upgrade.
            return;
        }
        let cancelled = false;
        const img = new Image();
        img.src = assetUrl(selectedImage);
        const markReady = () => {
            if (!cancelled) {
                setIsFullResReady(true);
            }
        };
        // decode() resolves only once the bitmap is ready to paint; falling back
        // to onload keeps older browsers (and jsdom) working.
        if (typeof img.decode === 'function') {
            img.decode().then(markReady, markReady);
        } else {
            img.onload = markReady;
            img.onerror = markReady;
        }
        return () => {
            cancelled = true;
        };
    }, [selectedImage, isZoomed, isFullResReady]);

    /** The one landscape scan means the ratio has to come from the file. */
    const handleNaturalSize = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        if (naturalWidth > 0 && naturalHeight > 0) {
            setAspect(`${naturalWidth} / ${naturalHeight}`);
            setRatio(naturalWidth / naturalHeight);
        }
    }, []);

    // Move focus into the dialog on open, restore it to the trigger on close.
    // Only act on actual open/close transitions — `selectedImage` also
    // changes on in-modal next/prev navigation, and reacting to those would
    // keep re-capturing the close button itself as the "previously focused"
    // element instead of the original trigger outside the modal.
    useEffect(() => {
        const isOpen = !!selectedImage;
        if (isOpen && !wasOpenRef.current) {
            previouslyFocusedRef.current = document.activeElement as HTMLElement;
            closeButtonRef.current?.focus();
        } else if (!isOpen && wasOpenRef.current) {
            previouslyFocusedRef.current?.focus();
            previouslyFocusedRef.current = null;
        }
        wasOpenRef.current = isOpen;
    }, [selectedImage]);

    // Trap Tab focus within the dialog while it's open
    useEffect(() => {
        if (!selectedImage) {
            return;
        }

        const handleTabTrap = (e: KeyboardEvent) => {
            if (e.key !== 'Tab' || !modalRef.current) {
                return;
            }

            const focusable = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (!first || !last) {
                return;
            }

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        window.addEventListener('keydown', handleTabTrap);
        return () => window.removeEventListener('keydown', handleTabTrap);
    }, [selectedImage]);

    if (!selectedImage) {
        return null;
    }

    // Same normalisation as the caption below, or a screen reader hears
    // "1989. - 01. szám - 001. oldal" while the sighted reader is looking at
    // "1989. - 1. szám - 1. oldal".
    const altText = `${selectedYear}. - ${+selectedRelease}. szám - ${+selectedPage}. oldal${formatVersionLabel(selectedVersion)}`;

    return (
        <div
            className='modal'
            onClick={() => setSelectedImage(null)}
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Képnézegető"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className='modal-panel'
            >
                <div className="panel-header">
                    <button
                        type="button"
                        ref={closeButtonRef}
                        className='tool-button panel-close'
                        onClick={() => setSelectedImage(null)}
                    >
                        <span className='tool-icon' aria-hidden="true">&times;</span>
                        <span className='tool-label'>Bezárás</span>
                    </button>
                </div>
                <figure className="scan-figure">
                    <div
                        className={`scan-viewport${isZoomed ? ' is-zoomed' : ''}${isDragging ? ' is-dragging' : ''}`}
                        // Shape only. The box can still end up taller than this
                        // where the flexed height and `max-width: 100%` disagree
                        // (a phone); `object-fit: contain` centres the scan in
                        // it, and useZoomPan's pan bounds follow the scan rather
                        // than the box for exactly that reason.
                        style={{ aspectRatio: aspect }}
                        ref={setTarget}
                        {...handlers}
                    >
                        <div className="scan-stage" style={style}>
                            {thumbnail && !isLqipRetired && (
                                <img
                                    className="scan-lqip"
                                    src={assetUrl(thumbnail)}
                                    alt=""
                                    aria-hidden="true"
                                    draggable={false}
                                    onLoad={handleNaturalSize}
                                />
                            )}
                            <picture>
                                {/* The derivative is 960px wide against a 1275px
                                    original, so it's only a win where the viewport
                                    can't show more. Unconditional, it would cost
                                    every desktop reader a quarter of the scan's
                                    resolution — in the one view meant for reading. */}
                                {!hasWebpFailed && (
                                    <source
                                        type="image/webp"
                                        media={WEBP_MEDIA}
                                        srcSet={assetUrl(webpFor(selectedImage))}
                                    />
                                )}
                                <img
                                    className={`scan-full${isFullLoaded ? ' is-loaded' : ''}`}
                                    src={assetUrl(selectedImage)}
                                    alt={altText}
                                    draggable={false}
                                    onLoad={(e) => {
                                        handleNaturalSize(e);
                                        setIsFullLoaded(true);
                                    }}
                                    onError={() => {
                                        // A missing WebP derivative is
                                        // recoverable: drop the <source> and
                                        // the browser re-resolves to the
                                        // original JPEG below. Keep the
                                        // placeholder up meanwhile — marking
                                        // it loaded here is what previously
                                        // left an empty rectangle.
                                        //
                                        // Decided from the media query, not
                                        // from currentSrc: if the error fires
                                        // before a candidate resolves (an
                                        // aborted connection, and some
                                        // non-Chromium paths) currentSrc is the
                                        // empty string, and keying off it sent
                                        // a phone with a merely missing
                                        // derivative straight to the terminal
                                        // branch — a blank box. The <source> is
                                        // mounted iff !hasWebpFailed, so these
                                        // two conditions are exactly "the WebP
                                        // is what we asked the browser for".
                                        if (
                                            !hasWebpFailed &&
                                            window.matchMedia(WEBP_MEDIA).matches
                                        ) {
                                            setHasWebpFailed(true);
                                            return;
                                        }
                                        // The original failed too: a dropped
                                        // connection or a genuinely missing
                                        // scan fires no further load event, so
                                        // without this the placeholder blur or
                                        // the spinner would persist forever
                                        // with no sign anything went wrong.
                                        setIsFullLoaded(true);
                                    }}
                                />
                            </picture>
                            {/* Stacked rather than swapped in: replacing the
                                element would blank the scan for a frame. */}
                            {isZoomed && isFullResReady && (
                                <img
                                    className="scan-full is-loaded scan-original"
                                    src={assetUrl(selectedImage)}
                                    alt=""
                                    aria-hidden="true"
                                    draggable={false}
                                />
                            )}
                        </div>
                        {!isFullLoaded && !thumbnail && (
                            <div className="scan-spinner" role="status">
                                <span className="visually-hidden">Kép betöltése…</span>
                            </div>
                        )}
                    </div>
                </figure>

                {/* The caption and every control share one paper deck below the
                    dark stage. Without it they sit straight on the stage, where
                    the light theme's ink lands near-invisibly (measured at
                    1.09:1) — the scan is meant to be the only lit thing here,
                    so the text that describes it needs its own ground. */}
                <div className="panel-deck">
                    <figcaption className="panel-caption">
                        {selectedYear}. - {+selectedRelease}. szám -{' '}
                        {+selectedPage}. oldal
                        {formatVersionLabel(selectedVersion)}
                    </figcaption>

                {/* One bar for every control that operates the scan. Previously
                    these sat in five places around the screen — two of them
                    floating over the gallery itself — which read as clutter. */}
                <div className="viewer-toolbar">
                    <button
                        type="button"
                        className="tool-button tool-page tool-prev"
                        onClick={handlePrevious}
                        disabled={isPreviousDisabled}
                        aria-label="Előző oldal"
                    >
                        <span className="tool-icon" aria-hidden="true">&larr;</span>
                        <span className="tool-label">Előző</span>
                    </button>

                    <div className="tool-zoom">
                        <button
                            type="button"
                            className="tool-button"
                            onClick={zoomOut}
                            disabled={scale <= MIN_SCALE}
                            aria-label="Kicsinyítés"
                        >
                            <span className="tool-icon" aria-hidden="true">&minus;</span>
                            <span className="tool-label">Kicsinyítés</span>
                        </button>
                        <span className="zoom-level">{zoomPercent}%</span>
                        {/* Separate from the readout above, which changes on
                            every wheel tick and every pinch move: a live region
                            there queued dozens of announcements for one
                            continuous gesture. This one only carries the
                            settled value. */}
                        <span className="visually-hidden" aria-live="polite">
                            Nagyítás {announcedZoom} százalék
                        </span>
                        <button
                            type="button"
                            className="tool-button"
                            onClick={zoomIn}
                            disabled={scale >= MAX_SCALE}
                            aria-label="Nagyítás"
                        >
                            <span className="tool-icon" aria-hidden="true">+</span>
                            <span className="tool-label">Nagyítás</span>
                        </button>
                        <button
                            type="button"
                            className="tool-button tool-reset"
                            onClick={reset}
                            disabled={!isZoomed}
                            aria-label="Eredeti méret"
                        >
                            <span className="tool-label">Eredeti méret</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        className="tool-button tool-page tool-next"
                        onClick={handleNext}
                        disabled={isNextDisabled}
                        aria-label="Következő oldal"
                    >
                        <span className="tool-icon" aria-hidden="true">&rarr;</span>
                        <span className="tool-label">Következő</span>
                    </button>
                </div>

                {/* Subordinate: neither is why anyone opened the viewer. */}
                <div className="panel-secondary">
                    {/* The image itself no longer opens a new tab: that click
                        now belongs to double-tap-to-zoom. */}
                    <a
                        href={assetUrl(selectedImage)}
                        target='_blank'
                        rel='noreferrer'
                        className="secondary-link"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Eredeti megnyitása
                    </a>
                    <a
                        href={assetUrl(selectedImage)}
                        download={`demokrata_${selectedYear}_${selectedRelease}_${selectedPage}.jpg`}
                        className="secondary-link"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Letöltés
                    </a>
                </div>
                </div>
            </div>
        </div>
    );
}
