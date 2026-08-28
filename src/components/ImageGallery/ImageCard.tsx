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
    ? `${parsed.year}. - ${+parsed.release}. szám - ${pageNumber}. oldal`
    : date;

  return (
    <button type="button" className="image-card" onClick={() => setSelectedImage(full)}>
      {/* The scan sits on a mat rather than bleeding to the card edge, so it
          reads as a sheet of paper you can pick up. */}
      <span className="image-mat">
        <img
          src={assetUrl(preview ?? full)}
          alt={altText}
          className="image-preview"
          loading="lazy"
          width="148"
          height="203"
        />
      </span>
      <span className="image-label">
        <span className="image-date">{pageNumber}. oldal{versionLabel}</span>
        {pageNumber === 1 && !versionLabel && (
          <span className="image-note">Címlap</span>
        )}
        {/* Only shows on hover/focus: nothing on the old card said a thumbnail
            was a button, which is the first thing an unfamiliar reader misses. */}
        <span className="image-open" aria-hidden="true">Megnyitás &rarr;</span>
      </span>
    </button>
  );
};
