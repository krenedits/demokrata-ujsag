import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import fileList from "../../fileList.json";
import useSmoothScroll from "../../hooks/useSmoothScroll";
import FullSizeImage from "./FullSizeImage";
import { ImageCard } from "./ImageCard";
import "./ImageGallery.css";
import YearSelector from "./YearSelector";
import Filters from "./Filters";
import { ImageEntry } from "../../types";

export interface ImageCardProps {
  date: string;
  preview?: string;
  full: string;
  setSelectedImage: (image: string | null) => void;
}

const getImages = (
  images: ImageEntry[],
  author: string | null,
  title: string | null,
  searchText: string | null
) => {
  return images
    .filter((image) => {
      if (author) {
        return image.articles?.some((article) => article.author === author);
      }
      return true;
    })
    .filter((image) => {
      if (title) {
        return image.articles?.some((article) => article.title === title);
      }
      return true;
    })
    .filter((image) => {
      if (searchText) {
        return image.text?.toLowerCase().includes(searchText.toLowerCase());
      }
      return true;
    });
};

const DOUBLE_RELEASE = ["1991-04"];

function ImageGallery() {
  const { year: urlYear } = useParams<{ year: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [author, setAuthor] = useState<string | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  
  const selectedImage = useMemo(() => searchParams.get('image'), [searchParams]);

  const selectedYear = useMemo(() => {
    if (selectedImage) {
        return selectedImage.split("/")[2] as keyof typeof fileList;
    }
    return urlYear as keyof typeof fileList;
  }, [selectedImage, urlYear]);

  useSmoothScroll();

  useEffect(() => {
    if (urlYear && !selectedImage) {
        const element = document.getElementById(urlYear);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
  }, [urlYear, selectedImage]);

  const filteredYearsData = useMemo(() => {
    return Object.keys(fileList).map(year => {
        const yearContent = fileList[year as keyof typeof fileList];
        const filteredReleases = Object.entries(yearContent)
            .map(([release, images]) => {
                const filtered = getImages(images as ImageEntry[], author, title, searchText);
                return { release, images: filtered };
            })
            .filter(item => item.images.length > 0);
        
        return { year, releases: filteredReleases };
    }).filter(item => item.releases.length > 0);
  }, [author, title, searchText]);

  const filteredYears = useMemo(() => 
    filteredYearsData.map(d => d.year),
    [filteredYearsData]
  );

  const handleSetSelectedImage = useCallback((image: string | null) => {
    if (image) {
        setSearchParams({ image });
    } else {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('image');
        setSearchParams(newParams);
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="image-gallery">
      <Filters
        author={author ?? ""}
        setAuthor={setAuthor}
        title={title ?? ""}
        setTitle={setTitle}
        searchText={searchText}
        setSearchText={setSearchText}
      />
      <YearSelector
        selectedImage={selectedImage}
        filteredYears={filteredYears}
      />
      {filteredYearsData.map(({ year, releases }, z) => (
        <div key={year} className="year-section" id={year}>
          <h2 className="year-section-title" style={{ zIndex: z }}>
            {year}
          </h2>
          {releases.map(({ release, images }) => {
                const isDoubleRelease = DOUBLE_RELEASE.includes(
                  `${year}-${release}`
                )
                const releaseNumber = isDoubleRelease ? [+release, +release + 1].join('-') : +release;
              return (
                <article key={release}>
                  <h3 className="year-section-release-title">
                    {releaseNumber}. szám
                  </h3>
                  <div className="year-images">
                    {images.map((image) => (
                      <ImageCard
                        key={image.image}
                        date={image.date}
                        preview={image.image_k}
                        full={image.image}
                        setSelectedImage={handleSetSelectedImage}
                      />
                    ))}
                  </div>
                </article>
              );
            })}
        </div>
      ))}

      <FullSizeImage
        selectedImage={selectedImage}
        setSelectedImage={handleSetSelectedImage}
        selectedYear={selectedYear}
      />
    </div>
  );
}


export default ImageGallery;
