import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './ImageGallery.css';

export interface YearOption {
    year: string;
    /** Issues in this year that survive the current filters. */
    issues: number;
    pages: number;
}

interface YearSelectorProps {
    /** The year currently in view, if any — drives the active pill. */
    selectedYear: string | undefined;
    years: YearOption[];
}

const ALL = '';

export default function YearSelector({ selectedYear, years }: YearSelectorProps) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

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

    const totalPages = useMemo(
        () => years.reduce((sum, option) => sum + option.pages, 0),
        [years]
    );

    return (
        <nav className="year-nav" aria-label="Évszám választása">
            <h2 className="year-nav-title" id="evszam-cimke">
                Válasszon évszámot
            </h2>

            {/* Two controls, one at a time: the pills below 620px would take a
                third of a phone screen before a single page was visible, and a
                native select is the one picker every reader already knows. Only
                one is ever displayed, so assistive tech sees only one too. */}
            <div className="year-select">
                <label className="year-select-label" htmlFor="year-select">
                    Évszám
                </label>
                <select
                    id="year-select"
                    className="year-select-input"
                    value={selectedYear ?? ALL}
                    onChange={(e) =>
                        navigate({
                            pathname: e.target.value ? `/${e.target.value}` : '/',
                            search,
                        })
                    }
                >
                    <option value={ALL}>
                        Mind &ndash; {totalPages} oldal
                    </option>
                    {years.map(({ year, issues }) => (
                        <option key={year} value={year}>
                            {year} &ndash; {issues} lapszám
                        </option>
                    ))}
                </select>
            </div>

            <ul className="year-selector">
                <li>
                    {/* With "/:year" narrowing the gallery to a single year, this is
                        the way back to browsing the whole archive. */}
                    <Link
                        to={{ pathname: '/', search }}
                        className={selectedYear ? '' : 'active'}
                        aria-current={selectedYear ? undefined : 'page'}
                    >
                        <span className="year-pill-name">Mind</span>
                        <span className="year-pill-count">{totalPages} oldal</span>
                    </Link>
                </li>
                {years.map(({ year, issues }) => (
                    <li key={year}>
                        <Link
                            to={{ pathname: `/${year}`, search }}
                            className={year === selectedYear ? 'active' : ''}
                            aria-current={year === selectedYear ? 'page' : undefined}
                        >
                            <span className="year-pill-name">{year}</span>
                            <span className="year-pill-count">{issues} lapszám</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
