import { useEffect } from 'react';
import Autocomplete from '../Autocomplete';
import { getAuthors, getTitles } from './utils';

interface FiltersProps {
    author: string;
    title: string;
    setAuthor: (author: string) => void;
    setTitle: (title: string) => void;
}

export default function Filters({
    author,
    setAuthor,
    setTitle,
    title,
}: FiltersProps) {
    const authors = getAuthors();
    const titles = getTitles(author);

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
            />
        </div>
    );
}
