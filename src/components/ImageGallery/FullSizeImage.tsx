import React, { useCallback, useEffect } from 'react';
import ImageZoom from 'react-image-zooom';
import fileList from '../../fileList.json';

interface FullSizeImageProps {
    selectedImage: string | null;
    setSelectedImage: (image: string | null) => void;
    selectedYear: keyof typeof fileList;
}

export default function FullSizeImage({
    selectedImage,
    setSelectedImage,
    selectedYear,
}: FullSizeImageProps) {
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

    const handlePrevious = useCallback(
        (e: React.MouseEvent | KeyboardEvent) => {
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
        (e: React.MouseEvent | KeyboardEvent) => {
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

    useEffect(() => {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                handlePrevious(e);
            } else if (e.key === 'ArrowRight') {
                handleNext(e);
            } else if (e.key === 'Escape') {
                setSelectedImage(null);
            }
        });
    }, [
        selectedYear,
        selectedImage,
        handlePrevious,
        handleNext,
        setSelectedImage,
    ]);

    if (!selectedImage) {
        return null;
    }

    return (
        <div className='modal' onClick={() => setSelectedImage(null)}>
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
            <div onClick={(e) => e.stopPropagation()} className='modal-content'>
                <ImageZoom
                    src={selectedImage}
                    alt='Full-size view'
                    zoom='200'
                />
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
