import { useState } from 'react';
import fileList from '../../fileList.json';
import useSmoothScroll from '../../hooks/useSmoothScroll';
import FullSizeImage from './FullSizeImage';
import { ImageCard } from './ImageCard';
import './ImageGallery.css';

export interface ImageCardProps {
    date: string;
    preview?: string;
    full: string;
    setSelectedImage: (image: string | null) => void;
}

function ImageGallery() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const selectedYear = selectedImage?.split('/')[2] as keyof typeof fileList;

    useSmoothScroll();

    return (
        <div className='image-gallery'>
            <ul className='year-selector'>
                {Object.keys(fileList).map((year) => (
                    <li key={year}>
                        <a
                            href={`#${year}`}
                            className={year === selectedYear ? 'active' : ''}
                        >
                            {year}
                        </a>
                    </li>
                ))}
            </ul>
            {Object.keys(fileList).map((year, z) => (
                <div key={year} className='year-section' id={year}>
                    <h2 className='year-section-title' style={{ zIndex: z }}>
                        {year}
                    </h2>
                    {Object.entries(
                        fileList[year as keyof typeof fileList]
                    ).map(([release, images]) => (
                        <>
                            <h3 className='year-section-release-title'>
                                {+release}. kiadás
                            </h3>
                            <div className='year-images'>
                                {images.map((image) => (
                                    <ImageCard
                                        key={image.date}
                                        date={image.date}
                                        preview={'.' + image.image_k}
                                        full={'.' + image.image}
                                        setSelectedImage={setSelectedImage}
                                    />
                                ))}
                            </div>
                        </>
                    ))}
                </div>
            ))}

            <FullSizeImage
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                selectedYear={selectedYear}
            />
        </div>
    );
}

export default ImageGallery;
