import React from "react";
import { ImageCardProps } from ".";

// Render a single image card, either preview or full size
export const ImageCard: React.FC<ImageCardProps> = ({
  date,
  preview,
  full,
  setSelectedImage,
}) => {
    const version = full.includes('_') ? +(full.split('_')[1].match(/\d+/) ?? 0) : 0;

  return (
    <div className="image-card" onClick={() => setSelectedImage(full)}>
      <img
        src={"." + (preview ?? full)}
        alt={date}
        className="image-preview"
        loading="lazy"
        width="148"
        height="203"
      />
      <p className="image-date">{+date.split("-")[2]}. oldal{version ? ' (' + (version + 1) + '. verzió)' : ''}</p>
    </div>
  );
};
