import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './ImageGallery.css';

interface YearSelectorProps {
    /** The year currently in view, if any — drives the active pill. */
    selectedYear: string | undefined;
    filteredYears: string[];
}

export default function YearSelector({
    selectedYear,
    filteredYears,
}: YearSelectorProps) {
    const [searchParams] = useSearchParams();

    // These pills are rendered from the years that matched the *current*
    // filters, so navigating to one has to carry those filters along —
    // a bare path would drop the very search that produced the pill.
    const search = useMemo(() => {
        const next = new URLSearchParams(searchParams);
        // The viewer points at one specific page; changing year should leave it.
        next.delete('image');
        const query = next.toString();
        return query ? `?${query}` : '';
    }, [searchParams]);

    return (
        <ul className='year-selector'>
            <li>
                {/* With "/:year" narrowing the gallery to a single year, this is
                    the way back to browsing the whole archive. */}
                <Link
                    to={{ pathname: '/', search }}
                    className={selectedYear ? '' : 'active'}
                    aria-current={selectedYear ? undefined : 'page'}
                >
                    Mind
                </Link>
            </li>
            {filteredYears.map((year) => (
                <li key={year}>
                    <Link
                        to={{ pathname: `/${year}`, search }}
                        className={year === selectedYear ? 'active' : ''}
                        aria-current={year === selectedYear ? 'page' : undefined}
                    >
                        {year}
                    </Link>
                </li>
            ))}
        </ul>
    );
}
