import { useState } from 'react';
import fileList from '../../fileList.json';
import useSmoothScroll from '../../hooks/useSmoothScroll';
import FullSizeImage from './FullSizeImage';
import { ImageCard } from './ImageCard';
import './ImageGallery.css';
import YearSelector from './YearSelector';
import Filters from './Filters';

export interface ImageCardProps {
    date: string;
    preview?: string;
    full: string;
    setSelectedImage: (image: string | null) => void;
}

interface Article {
    image: string;
    image_k?: string;
    date: string;
    articles?: {
        author: string;
        title: string;
    }[];
}

const getImages = (
    images: Article[],
    author: string | null,
    title: string | null
) => {
    return images
        .filter((image) => {
            if (author) {
                return image.articles?.some(
                    (article) => article.author === author
                );
            }
            return true;
        })
        .filter((image) => {
            if (title) {
                if (
                    image.articles?.some((article) => article.title === title)
                ) {
                    console.log(title, image.articles);
                }
                return image.articles?.some(
                    (article) => article.title === title
                );
            }
            return true;
        });
};

function ImageGallery() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [author, setAuthor] = useState<string | null>(null);
    const [title, setTitle] = useState<string | null>(null);
    const selectedYear = selectedImage?.split('/')[2] as keyof typeof fileList;

    useSmoothScroll();

    const filteredYears = Object.keys(fileList).filter((year) =>
        Object.values(fileList[year as keyof typeof fileList]).some(
            (images) => getImages(images, author, title).length > 0
        )
    );

    return (
        <div className='image-gallery'>
            <Filters
                author={author ?? ''}
                setAuthor={setAuthor}
                title={title ?? ''}
                setTitle={setTitle}
            />
            <YearSelector
                selectedImage={selectedImage}
                filteredYears={filteredYears}
            />
            {filteredYears.map((year, z) => (
                <div key={year} className='year-section' id={year}>
                    <h2 className='year-section-title' style={{ zIndex: z }}>
                        {year}
                    </h2>
                    {Object.entries(fileList[year as keyof typeof fileList])
                        .filter(
                            ([, images]) =>
                                getImages(images, author, title).length > 0
                        )
                        .map(([release, images]) => (
                            <article key={release}>
                                <h3 className='year-section-release-title'>
                                    {+release}. szám
                                </h3>
                                <div className='year-images'>
                                    {getImages(images, author, title).map(
                                        (image) => (
                                            <ImageCard
                                                key={image.image}
                                                date={image.date}
                                                preview={image.image_k}
                                                full={image.image}
                                                setSelectedImage={
                                                    setSelectedImage
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            </article>
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
