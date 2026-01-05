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
            <Autocomplete
                value={author}
                setter={setAuthor}
                items={authors}
                label='Szerző'
            />
            <Autocomplete
                value={title}
                setter={setTitle}
                items={titles}
                label='Cikk'
                inputProps={{
                    style: {
                        width: 'min(350px, 80dvw)',
                    },
                }}
            />
            <div className='autocomplete'>
                <label className='filters-title'>Szöveg keresése:</label>
                <input
                    type='text'
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder='Keresés az oldalak szövegében...'
                    style={{
                        width: 'min(300px, 80dvw)',
                    }}
                />
            </div>
        </div>
    );
}
