import React from "react";
import { ImageCardProps } from ".";
import { formatVersionLabel, parseImagePath } from "./utils";
import { assetUrl } from "../../utils";

// Render a single image card, either preview or full size
export const ImageCard: React.FC<ImageCardProps> = ({
  date,
  preview,
  full,
  setSelectedImage,
}) => {
  const parsed = parseImagePath(full);
  const pageNumber = parsed.page ? +parsed.page : +(date.split("-")[2] ?? 0);
  const versionLabel = formatVersionLabel(parsed.version);
  const altText = parsed.year
    ? `${parsed.year}. - ${parsed.release}. szám - ${parsed.page}. oldal`
    : date;

  return (
    <button type="button" className="image-card" onClick={() => setSelectedImage(full)}>
      <img
        src={assetUrl(preview ?? full)}
        alt={altText}
        className="image-preview"
        loading="lazy"
        width="148"
        height="203"
      />
      <span className="image-date">{pageNumber}. oldal{versionLabel}</span>
    </button>
  );
};
