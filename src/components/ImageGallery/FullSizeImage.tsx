import React, { useCallback, useEffect, useRef } from 'react';
import { parseImagePath, typedFileList } from './utils';
import { ImageEntry } from '../../types';

interface FullSizeImageProps {
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    selectedYear: string;
}

type PageEvent = React.MouseEvent | KeyboardEvent | TouchEvent;

const usePageScroll = (
    setSelectedImage: (image: string | null) => void,
    handlePrevious: (e: PageEvent) => void,
    handleNext: (e: PageEvent) => void,
    handleFirst: (e: PageEvent) => void,
    handleLast: (e: PageEvent) => void
) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                handlePrevious(e);
            } else if (e.key === 'ArrowRight') {
                handleNext(e);
            } else if (e.key === 'Escape') {
                setSelectedImage(null);
            } else if (e.key === 'Home') {
                handleFirst(e);
            } else if (e.key === 'End') {
                handleLast(e);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handlePrevious, handleNext, handleFirst, handleLast, setSelectedImage]);
};

export default function FullSizeImage({
    selectedImage,
    setSelectedImage,
    selectedYear,
}: FullSizeImageProps) {
    const ref = useRef<HTMLDivElement>(null);
    const currentYear = typedFileList[selectedYear];
    
    const { release: selectedRelease, page: selectedPage, version: selectedVersion } = selectedImage ? parseImagePath(selectedImage) : { release: '', page: '', version: '' };
    
    const currentRelease = currentYear?.[selectedRelease] as ImageEntry[] | undefined;
    
    const currentIndex = currentRelease ? currentRelease.findIndex((image) => image.image === selectedImage) : -1;
    const isPreviousDisabled = !selectedYear || !currentRelease || currentIndex <= 0;
    const isNextDisabled = !selectedYear || !currentRelease || currentIndex === currentRelease.length - 1;

    const handleFirst = useCallback((e: PageEvent) => {
        e.stopPropagation();
        if (currentRelease && currentRelease.length > 0) {
            setSelectedImage(currentRelease[0].image);
        }
    }, [currentRelease, setSelectedImage]);

    const handleLast = useCallback((e: PageEvent) => {
        e.stopPropagation();
        if (currentRelease && currentRelease.length > 0) {
            setSelectedImage(currentRelease[currentRelease.length - 1].image);
        }
    }, [currentRelease, setSelectedImage]);

    const handlePrevious = useCallback(
        (e: PageEvent) => {
            e.stopPropagation();
            if (currentIndex > 0 && currentRelease) {
                setSelectedImage(currentRelease[currentIndex - 1].image);
            }
        },
        [currentIndex, currentRelease, setSelectedImage]
    );

    const handleNext = useCallback(
        (e: PageEvent) => {
            e.stopPropagation();
            if (currentRelease && currentIndex < currentRelease.length - 1) {
                setSelectedImage(currentRelease[currentIndex + 1].image);
            }
        },
        [currentIndex, currentRelease, setSelectedImage]
    );

    usePageScroll(setSelectedImage, handlePrevious, handleNext, handleFirst, handleLast);

    // Preload next image
    useEffect(() => {
        if (currentRelease && currentIndex < currentRelease.length - 1) {
            const nextImage = new Image();
            nextImage.src = './' + currentRelease[currentIndex + 1].image;
        }
    }, [currentIndex, currentRelease]);

    if (!selectedImage) {
        return null;
    }

    return (
        <div
            className='modal'
            onClick={() => setSelectedImage(null)}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Képnézegető"
        >
            <div className='close-container' onClick={() => setSelectedImage(null)}>
                <span className='close-icon'>&times;</span>
                <span className='close-label'>Bezárás</span>
            </div>
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
                        href={'./' + selectedImage}
                        target='_blank'
                        rel='noreferrer'
                        title="Kép megnyitása új lapon"
                    >
                        <img src={'./' + selectedImage} alt={`${selectedYear}. - ${selectedRelease}. szám - ${selectedPage}. oldal`} />
                    </a>
                    <figcaption>
                        <div className="caption-text">
                            {selectedYear}. - {+selectedRelease}. szám -{' '}
                            {+selectedPage}. oldal
                            {selectedVersion ? ' (' + (+selectedVersion + 1) + '. verzió)' : ''}
                        </div>
                        <a 
                            href={'./' + selectedImage} 
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
