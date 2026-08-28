import { useEffect, useMemo, useRef } from 'react';
import Autocomplete from '../Autocomplete';
import { getAuthors, getTitles } from './utils';

interface FiltersProps {
    author: string;
    title: string;
    searchText: string;
    setAuthor: (author: string) => void;
    setTitle: (title: string) => void;
    setSearchText: (text: string) => void;
    onClear: () => void;
    onClose: () => void;
}

export default function Filters({
    author,
    setAuthor,
    setTitle,
    title,
    searchText,
    setSearchText,
    onClear,
    onClose,
}: FiltersProps) {
    const authors = useMemo(() => getAuthors(), []);
    const titles = useMemo(() => getTitles(author), [author]);
    const hasFilters = !!author || !!title || !!searchText;

    // Titles are scoped to the selected author, so switching author invalidates
    // the chosen title. Skip the initial run: filters now come from the URL, and
    // clearing on mount would drop the title out of a shared link.
    const previousAuthorRef = useRef(author);
    useEffect(() => {
        if (previousAuthorRef.current !== author) {
            previousAuthorRef.current = author;
            setTitle('');
        }
    }, [author, setTitle]);

    return (
        <section className="search-panel" id="kereses-panel" aria-label="Keresés az archívumban">
            <h2 className="search-panel-title">Keresés az archívumban</h2>
            <p className="search-panel-hint">Elég egyetlen mezőt kitöltenie.</p>

            <div className="filter-group full-width-search">
                <label className="filters-title" htmlFor="text-search-input">
                    Keresés a lapok szövegében
                </label>
                <input
                    id="text-search-input"
                    type="text"
                    className="search-input text-search-input"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Például: iskola, cserkészet, tűzoltók"
                />
            </div>

            <div className="search-or">
                <span>VAGY</span>
            </div>

            <div className="filters">
                <div className="filter-group">
                    <Autocomplete
                        id="author-filter"
                        value={author}
                        setter={setAuthor}
                        items={authors}
                        label="Szerző neve"
                        inputProps={{
                            placeholder: 'Pl. Horváth Lajos',
                            className: 'search-input author-input',
                        }}
                    />
                </div>
                <div className="filter-group">
                    <Autocomplete
                        id="title-filter"
                        value={title}
                        setter={setTitle}
                        items={titles}
                        label="Cikk címe"
                        hint={
                            author
                                ? `${author} írásai közül`
                                : 'Szerző választása után csak az ő írásai'
                        }
                        inputProps={{
                            placeholder: 'Cikk címe...',
                            className: 'search-input title-input',
                        }}
                    />
                </div>
            </div>

            <div className="search-actions">
                {/* The filtering itself is live, so this reveals the results
                    rather than running a query — naming it "Keresés" would
                    promise a step that has already happened. */}
                <button type="button" className="button-primary" onClick={onClose}>
                    Találatok mutatása
                </button>
                <button type="button" onClick={onClear} disabled={!hasFilters}>
                    Szűrők törlése
                </button>
            </div>
        </section>
    );
}
