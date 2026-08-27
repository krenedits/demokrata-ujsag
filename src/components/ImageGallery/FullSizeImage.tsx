import React, { useCallback, useEffect, useRef } from 'react';
import { formatVersionLabel, parseImagePath, typedFileList } from './utils';
import { assetUrl } from '../../utils';
import { ImageEntry } from '../../types';

interface FullSizeImageProps {
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    selectedYear: string | undefined;
}

type PageEvent = React.MouseEvent | KeyboardEvent | TouchEvent;

const usePageScroll = (
    isOpen: boolean,
    setSelectedImage: (image: string | null) => void,
    handlePrevious: (e: PageEvent) => void,
    handleNext: (e: PageEvent) => void,
    handleFirst: (e: PageEvent) => void,
    handleLast: (e: PageEvent) => void
) => {
    useEffect(() => {
        // Without this guard the listener stays live on the plain gallery,
        // where Escape would "close" an already-closed viewer and push a
        // duplicate history entry each press, deadening the Back button.
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (e: KeyboardEvent) => {
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
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handlePrevious, handleNext, handleFirst, handleLast, setSelectedImage]);
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
    const ref = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);
    const wasOpenRef = useRef(false);
    const currentYear = selectedYear ? typedFileList[selectedYear] : undefined;

    const { release: selectedRelease, page: selectedPage, version: selectedVersion } = selectedImage ? parseImagePath(selectedImage) : { release: '', page: '', version: '' };

    const currentRelease = currentYear?.[selectedRelease] as ImageEntry[] | undefined;

    const currentIndex = currentRelease ? currentRelease.findIndex((image) => image.image === selectedImage) : -1;
    const isPreviousDisabled = !selectedYear || !currentRelease || currentIndex <= 0;
    const isNextDisabled = !selectedYear || !currentRelease || currentIndex === currentRelease.length - 1;
    const nextImageEntry = currentRelease && currentIndex < currentRelease.length - 1
        ? currentRelease[currentIndex + 1]
        : undefined;

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

    const handlePrevious = useCallback(
        (e: PageEvent) => {
            e.stopPropagation();
            const prev = currentIndex > 0 ? currentRelease?.[currentIndex - 1] : undefined;
            if (prev) {
                setSelectedImage(prev.image);
            }
        },
        [currentIndex, currentRelease, setSelectedImage]
    );

    const handleNext = useCallback(
        (e: PageEvent) => {
            e.stopPropagation();
            if (nextImageEntry) {
                setSelectedImage(nextImageEntry.image);
            }
        },
        [nextImageEntry, setSelectedImage]
    );

    usePageScroll(!!selectedImage, setSelectedImage, handlePrevious, handleNext, handleFirst, handleLast);
    useBodyScrollLock(!!selectedImage);

    // Preload next image
    useEffect(() => {
        if (nextImageEntry) {
            const nextImage = new Image();
            nextImage.src = assetUrl(nextImageEntry.image);
        }
    }, [nextImageEntry]);

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
            <button
                type="button"
                ref={closeButtonRef}
                className='close-container'
                onClick={() => setSelectedImage(null)}
            >
                <span className='close-icon'>&times;</span>
                <span className='close-label'>Bezárás</span>
            </button>
            <button
                className={'previous'}
                onClick={handlePrevious}
                disabled={isPreviousDisabled}
                aria-label="Előző oldal"
            >
                <div className="nav-content">
                    <span className="nav-icon">{'<'}</span>
                    <span className="nav-label">Előző</span>
                </div>
            </button>
            <div
                onClick={(e) => e.stopPropagation()}
                className='modal-content'
                ref={ref}
            >
                <figure style={{ display: 'flex', flexDirection: 'column' }}>
                    <a
                        href={assetUrl(selectedImage)}
                        target='_blank'
                        rel='noreferrer'
                        title="Kép megnyitása új lapon"
                    >
                        <picture>
                            {/* The derivative is 960px wide against a 1275px
                                original, so it's only a win where the viewport
                                can't show more. Unconditional, it would cost
                                every desktop reader a quarter of the scan's
                                resolution — in the one view meant for reading. */}
                            <source
                                type="image/webp"
                                media="(max-width: 960px)"
                                srcSet={assetUrl(selectedImage.replace(/\.jpe?g$/i, '_m.webp'))}
                            />
                            <img
                                src={assetUrl(selectedImage)}
                                alt={`${selectedYear}. - ${selectedRelease}. szám - ${selectedPage}. oldal`}
                            />
                        </picture>
                    </a>
                    <figcaption>
                        <div className="caption-text">
                            {selectedYear}. - {+selectedRelease}. szám -{' '}
                            {+selectedPage}. oldal
                            {formatVersionLabel(selectedVersion)}
                        </div>
                        <a
                            href={assetUrl(selectedImage)}
                            download={`demokrata_${selectedYear}_${selectedRelease}_${selectedPage}.jpg`}
                            className="download-link"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className="download-button">Letöltés</button>
                        </a>
                    </figcaption>
                </figure>
            </div>
            <button
                className='next'
                onClick={handleNext}
                disabled={isNextDisabled}
                aria-label="Következő oldal"
            >
               <div className="nav-content">
                    <span className="nav-icon">{'>'}</span>
                    <span className="nav-label">Következő</span>
                </div>
            </button>
        </div>
    );
}
