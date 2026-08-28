import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import fileList from "../../fileList.json";
import useDocumentTitle, { useCanonicalUrl } from "../../hooks/useDocumentTitle";
import useStickyHeaderHeight from "../../hooks/useStickyHeaderHeight";
import FullSizeImage from "./FullSizeImage";
import { ImageCard } from "./ImageCard";
import "./ImageGallery.css";
import YearSelector, { YearOption } from "./YearSelector";
import Filters from "./Filters";
import { isKnownImage, isValidYear, parseImagePath } from "./utils";
import { ImageEntry } from "../../types";
import { prefersReducedMotion } from "../../utils";

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
  searchText: string | null,
  searchIndex: Record<string, string> | null
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
        const text = searchIndex?.[image.image];
        return !!text && text.toLowerCase().includes(searchText.toLowerCase());
      }
      return true;
    });
};

const DOUBLE_RELEASE = ["1991-04"];
const SEARCH_DEBOUNCE_MS = 250;

// A few issues were published as a double number ("4-5. szám") under a single
// scan folder, so the label doesn't always match the folder name.
const releaseLabel = (year: string, release: string) =>
  DOUBLE_RELEASE.includes(`${year}-${release}`)
    ? [+release, +release + 1].join('-')
    : `${+release}`;

interface ImageGalleryProps {
  /** The masthead owns the toggle; the panel and its state live down here. */
  isSearchOpen: boolean;
  onCloseSearch: () => void;
}

function ImageGallery({ isSearchOpen, onCloseSearch }: ImageGalleryProps) {
  const { year: urlYear } = useParams<{ year: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filters live in the URL so a filtered view is shareable and survives a
  // refresh. The free-text box keeps a local copy as well, so typing stays
  // responsive while only the debounced value is committed to the URL.
  const author = searchParams.get('author') || null;
  const title = searchParams.get('title') || null;
  const searchQuery = searchParams.get('q') ?? '';
  const [searchText, setSearchText] = useState(searchQuery);

  const scrollPositionRef = useRef<number | null>(null);

  const [searchIndex, setSearchIndex] = useState<Record<string, string> | null>(null);
  const [searchIndexFailed, setSearchIndexFailed] = useState(false);
  const [searchIndexAttempt, setSearchIndexAttempt] = useState(0);
  const searchIndexRequestedRef = useRef(false);

  // A stale or hand-edited ?image= would otherwise open a modal around a broken
  // <img> and put ". 0. szam, 0. oldal" in the tab title, so anything that
  // doesn't resolve to a real page is treated as no selection at all.
  const rawSelectedImage = searchParams.get('image');
  const selectedImage = useMemo(
    () => (rawSelectedImage && isKnownImage(rawSelectedImage) ? rawSelectedImage : null),
    [rawSelectedImage]
  );

  const activeYear = isValidYear(urlYear) ? urlYear : undefined;

  const selectedYear = useMemo(() => {
    if (selectedImage) {
        const { year } = parseImagePath(selectedImage);
        return isValidYear(year) ? year : undefined;
    }
    return activeYear;
  }, [selectedImage, activeYear]);

  const setFilterParam = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    // Changing a filter refines the current view rather than being a place
    // you'd want to step back through one keystroke at a time.
    }, { replace: true });
  }, [setSearchParams]);

  const setAuthor = useCallback(
    (value: string) => setFilterParam('author', value),
    [setFilterParam]
  );
  const setTitle = useCallback(
    (value: string) => setFilterParam('title', value),
    [setFilterParam]
  );

  // Follow the URL when it changes from outside this component — back/forward,
  // or a shared link that already carries a search term. Our own debounced
  // writes are recorded first, so they don't bounce back and clobber
  // characters typed while the resulting navigation was rendering.
  const lastCommittedSearchRef = useRef(searchQuery);
  useEffect(() => {
    if (searchQuery === lastCommittedSearchRef.current) {
      return;
    }
    lastCommittedSearchRef.current = searchQuery;
    setSearchText(searchQuery);
  }, [searchQuery]);

  // ...and commit typing back to the URL on a debounce, which doubles as the
  // debounce in front of the (expensive) full-text filter below.
  useEffect(() => {
    if (searchText === searchQuery) {
      return;
    }
    const handle = setTimeout(() => {
      lastCommittedSearchRef.current = searchText;
      setFilterParam('q', searchText);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchText, searchQuery, setFilterParam]);

  // Fetch the (large, OCR-text) search index lazily, once, the first time it's
  // actually needed — keeps it out of the main JS bundle for visitors who never search.
  useEffect(() => {
    if (!searchQuery || searchIndexRequestedRef.current) {
      return;
    }
    searchIndexRequestedRef.current = true;
    setSearchIndexFailed(false);
    fetch(`${import.meta.env.BASE_URL}searchIndex.json`)
      .then((res) => {
        // Without this a 404 falls through to res.json(), which throws on the
        // error page and lands in catch() — but a silent empty index used to
        // render "no results", indistinguishable from a genuine empty result.
        if (!res.ok) {
          throw new Error(`searchIndex.json: ${res.status}`);
        }
        return res.json();
      })
      .then((data: Record<string, string>) => setSearchIndex(data))
      .catch(() => {
        // Clear the guard so the retry button can actually re-request.
        searchIndexRequestedRef.current = false;
        setSearchIndexFailed(true);
      });
  }, [searchQuery, searchIndexAttempt]);

  const retrySearchIndex = useCallback(() => {
    setSearchIndexAttempt((n) => n + 1);
  }, []);

  // True from the very first render where a search term appears until the
  // (lazily-fetched, cached-after-first-load) search index resolves — derived
  // straight from state so there's no one-render lag where a stale/empty
  // filter result would flash "no results" before this pending state applies.
  const isSearchIndexPending = !!searchQuery && !searchIndex && !searchIndexFailed;

  // Every year that still has matching pages. Drives the year selector, so it
  // deliberately ignores the year narrowing below — otherwise picking a year
  // would hide every other year from the selector and strand the user there.
  const matchingYearsData = useMemo(() => {
    if (isSearchIndexPending) {
        return [];
    }
    return Object.entries(fileList).map(([year, yearContent]) => {
        const filteredReleases = Object.entries(yearContent)
            .map(([release, images]) => {
                const filtered = getImages(images as ImageEntry[], author, title, searchQuery, searchIndex);
                return { release, images: filtered };
            })
            .filter(item => item.images.length > 0);

        return { year, releases: filteredReleases };
    }).filter(item => item.releases.length > 0);
  }, [author, title, searchQuery, searchIndex, isSearchIndexPending]);

  // While the search index loads, `matchingYearsData` is empty — driving the
  // selector off it would blink the entire year navigation away and back on
  // the first search of a session. Author/title alone is cheap to evaluate and
  // keeps the pills stable through the fetch.
  // Each pill carries how much is behind it, so the reader can tell a thin year
  // from a thick one before spending a click on it. The counts follow the
  // current filters for the same reason the pill list does.
  const yearOptions = useMemo<YearOption[]>(() => {
    if (!isSearchIndexPending) {
        return matchingYearsData.map((d) => ({
            year: d.year,
            issues: d.releases.length,
            pages: d.releases.reduce((sum, r) => sum + r.images.length, 0),
        }));
    }
    return Object.entries(fileList)
        .map(([year, yearContent]) => {
            const releases = Object.values(yearContent)
                .map((images) => getImages(images as ImageEntry[], author, title, null, null))
                .filter((images) => images.length > 0);
            return {
                year,
                issues: releases.length,
                pages: releases.reduce((sum, images) => sum + images.length, 0),
            };
        })
        .filter((option) => option.issues > 0);
  }, [matchingYearsData, isSearchIndexPending, author, title]);

  const filteredYearsData = useMemo(() =>
    activeYear
      ? matchingYearsData.filter((d) => d.year === activeYear)
      : matchingYearsData,
    [matchingYearsData, activeYear]
  );

  // Keeps the sticky issue headers pinned directly under the sticky year
  // header, whatever the year header actually measures at.
  useStickyHeaderHeight(filteredYearsData);

  // Switching years swaps the whole list out; leaving the reader wherever the
  // previous year happened to be scrolled to would drop them mid-archive.
  const previousYearRef = useRef(activeYear);
  useEffect(() => {
    if (previousYearRef.current !== activeYear) {
        previousYearRef.current = activeYear;
        window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        });
    }
  }, [activeYear]);

  const titleDetail = useMemo(() => {
    if (selectedImage) {
        const { year, release, page } = parseImagePath(selectedImage);
        return `${year}. ${+release}. szám, ${+page}. oldal`;
    }
    return activeYear;
  }, [selectedImage, activeYear]);
  useDocumentTitle(titleDetail);
  useCanonicalUrl(activeYear ?? '');

  const handleClearFilters = useCallback(() => {
    setSearchText('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('author');
      next.delete('title');
      next.delete('q');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Set when the viewer was opened from within the gallery, so closing can pop
  // that entry instead of stacking an identical one. Opening then closing used
  // to leave history as [gallery, gallery], where the reader's first Back press
  // changed nothing visible and Back looked broken.
  const openedInAppRef = useRef(false);

  const handleSetSelectedImage = useCallback((image: string | null) => {
    const wasOpen = !!selectedImage;

    if (image) {
      if (!wasOpen) {
        scrollPositionRef.current = window.scrollY;
        openedInAppRef.current = true;
      }
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('image', image);
        return next;
      // Opening is the one step worth backing out of; paging within the viewer
      // replaces, so a 16-page issue doesn't bury the gallery under 16 entries.
      }, { replace: wasOpen });
      return;
    }

    if (openedInAppRef.current) {
      // Pops the entry that opening pushed, leaving history clean.
      openedInAppRef.current = false;
      navigate(-1);
      return;
    }

    // Opened straight from a shared ?image= link — there's no entry of ours to
    // pop, so drop the param in place.
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('image');
      return next;
    }, { replace: true });
  }, [selectedImage, setSearchParams, navigate]);

  // Strip an ?image= that points at nothing, so the URL stops advertising a
  // page that can't be shown. Replace, so it doesn't cost a history entry.
  useEffect(() => {
    if (!rawSelectedImage || selectedImage) {
      return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('image');
      return next;
    }, { replace: true });
  }, [rawSelectedImage, selectedImage, setSearchParams]);

  // Restoring in an effect rather than in the close handler covers closing via
  // the browser's Back button too, which never runs the handler.
  useEffect(() => {
    if (selectedImage || scrollPositionRef.current === null) {
        return;
    }
    const y = scrollPositionRef.current;
    scrollPositionRef.current = null;
    requestAnimationFrame(() => window.scrollTo({ top: y }));
  }, [selectedImage]);

  // A bad year is a single path segment, so it matches the "/:year" route
  // rather than the catch-all. Send it back to the full archive.
  if (urlYear && !activeYear) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="image-gallery shell">
      {isSearchOpen && (
        <Filters
          author={author ?? ""}
          setAuthor={setAuthor}
          title={title ?? ""}
          setTitle={setTitle}
          searchText={searchText}
          setSearchText={setSearchText}
          onClear={handleClearFilters}
          onClose={onCloseSearch}
        />
      )}
      <YearSelector
        selectedYear={activeYear}
        years={yearOptions}
      />
      {isSearchIndexPending && (
        <div className="empty-state" aria-live="polite">
          <p>Keresési index betöltése…</p>
        </div>
      )}
      {searchIndexFailed && (
        <div className="empty-state" role="alert">
          <p>A keresési index nem tölthető be. Kérjük, próbálja újra.</p>
          <button type="button" onClick={retrySearchIndex}>
            Újrapróbálkozás
          </button>
        </div>
      )}
      {!isSearchIndexPending && !searchIndexFailed && filteredYearsData.length === 0 && (
        <div className="empty-state">
          <p>Nincs találat a megadott szűrőkre.</p>
          <button type="button" onClick={handleClearFilters}>
            Szűrők törlése
          </button>
        </div>
      )}
      {!isSearchIndexPending && !searchIndexFailed &&
        filteredYearsData.map(({ year, releases }) => (
          // Each year is its own containing block, so its sticky <h2> is
          // released at the section's bottom edge and the next year's header
          // takes over the top — no manual per-year z-index laddering needed.
          <div key={year} className="year-section" id={year}>
            <h2 className="year-section-title">{year}</h2>
            {releases.map(({ release, images }) => (
              <article key={release} className="release-row">
                <h3 className="year-section-release-title">
                  {releaseLabel(year, release)}. szám
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
            ))}
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
