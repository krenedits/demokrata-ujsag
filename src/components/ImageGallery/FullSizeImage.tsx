import React, { useCallback, useEffect } from 'react';
import fileList from '../../fileList.json';

interface FullSizeImageProps {
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    selectedYear: keyof typeof fileList;
}

type PageEvent = React.MouseEvent | KeyboardEvent | TouchEvent;

const usePageScroll = (
    setSelectedImage: (image: string | null) => void,
    handlePrevious: (e: PageEvent) => void,
    handleNext: (e: PageEvent) => void
) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                handlePrevious(e);
            } else if (e.key === 'ArrowRight') {
                handleNext(e);
            } else if (e.key === 'Escape') {
                setSelectedImage(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handlePrevious, handleNext, setSelectedImage]);
};

export default function FullSizeImage({
    selectedImage,
    setSelectedImage,
    selectedYear,
}: FullSizeImageProps) {
    const ref = React.createRef<HTMLDivElement>();
    const currentYear = fileList[selectedYear];
    const selectedRelease = selectedImage
        ?.split('/')[3]
        .split('-')[1] as keyof typeof currentYear;
    const currentRelease = currentYear?.[selectedRelease];
    const isPreviousDisabled =
        !selectedYear ||
        currentRelease.findIndex((image) => image.image === selectedImage) ===
            0;
    const isNextDisabled =
        !selectedYear ||
        currentRelease.findIndex((image) => image.image === selectedImage) ===
            currentRelease.length - 1;

    const selectedPage = selectedImage
        ?.split('/')[3]
        .split('-')[2]
        .split('.')[0] as keyof typeof currentYear;

    const handlePrevious = useCallback(
        (e: PageEvent) => {
            e.stopPropagation();
            if (selectedImage) {
                const index = currentRelease.findIndex(
                    (image) => image.image === selectedImage
                );
                if (index > 0) {
                    setSelectedImage(currentRelease[index - 1].image);
                }
            }
        },
        [currentRelease, selectedImage, setSelectedImage]
    );

    const handleNext = useCallback(
        (e: PageEvent) => {
            e.stopPropagation();
            if (selectedImage) {
                const index = currentRelease.findIndex(
                    (image) => image.image === selectedImage
                );
                if (index < currentRelease.length - 1) {
                    setSelectedImage(currentRelease[index + 1].image);
                }
            }
        },
        [currentRelease, selectedImage, setSelectedImage]
    );

    usePageScroll(setSelectedImage, handlePrevious, handleNext);

    if (!selectedImage) {
        return null;
    }

    return (
        <div
            className='modal'
            onClick={() => setSelectedImage(null)}
            tabIndex={-1}
        >
            <span className='close' onClick={() => setSelectedImage(null)}>
                &times;
            </span>
            <button
                className={'previous'}
                onClick={handlePrevious}
                disabled={isPreviousDisabled}
            >
                {'<'}
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
                    >
                        <img src={'./' + selectedImage} alt='Full-size view' />
                    </a>
                    <figcaption>
                        {selectedYear}. - {+selectedRelease}. szám -{' '}
                        {+selectedPage}. oldal
                    </figcaption>
                </figure>
            </div>
            <button
                className='next'
                onClick={handleNext}
                disabled={isNextDisabled}
            >
                {'>'}
            </button>
        </div>
    );
}
