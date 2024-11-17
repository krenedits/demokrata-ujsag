import React from 'react';
import { ImageCardProps } from '.';

// Render a single image card, either preview or full size
export const ImageCard: React.FC<ImageCardProps> = ({
    date,
    preview,
    full,
    setSelectedImage,
}) => (
    <div className='image-card' onClick={() => setSelectedImage(full)}>
        <img
            src={preview || full}
            alt={date}
            className='image-preview'
            loading='lazy'
        />
        <p className='image-date'>{+date.split('-')[2]}. oldal</p>
    </div>
);
