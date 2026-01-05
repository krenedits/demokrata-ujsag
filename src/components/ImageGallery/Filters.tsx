import { useEffect, useMemo } from 'react';
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

    useEffect(() => {
        setTitle('');
    }, [author, setTitle]);

    return (
        <div className='filters'>
            <div className='filter-group'>
                <Autocomplete
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
                <label className='filters-title'>Szöveg keresése:</label>
                <input
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
