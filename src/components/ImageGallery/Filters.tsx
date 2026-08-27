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
}

export default function Filters({
    author,
    setAuthor,
    setTitle,
    title,
    searchText,
    setSearchText,
}: FiltersProps) {
    const authors = useMemo(() => getAuthors(), []);
    const titles = useMemo(() => getTitles(author), [author]);

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
        <div className='filters'>
            <div className='filter-group'>
                <Autocomplete
                    id='author-filter'
                    value={author}
                    setter={setAuthor}
                    items={authors}
                    label='Szerző keresése'
                    inputProps={{
                        placeholder: 'Pl. Horváth Lajos',
                        className: 'search-input author-input'
                    }}
                />
            </div>
            <div className='filter-group'>
                <Autocomplete
                    id='title-filter'
                    value={title}
                    setter={setTitle}
                    items={titles}
                    label='Cikk cím keresése'
                    inputProps={{
                        placeholder: 'Cikk címe...',
                        className: 'search-input title-input'
                    }}
                />
            </div>
            <div className='autocomplete full-width-search'>
                <label className='filters-title' htmlFor='text-search-input'>Szöveg keresése:</label>
                <input
                    id='text-search-input'
                    type='text'
                    className='search-input text-search-input'
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder='Keresés az oldalak teljes szövegében...'
                />
            </div>
        </div>
    );
}
