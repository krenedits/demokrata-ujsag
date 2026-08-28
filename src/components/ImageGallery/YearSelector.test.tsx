import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import YearSelector, { YearOption } from './YearSelector';

const LocationProbe = () => {
    const { pathname, search } = useLocation();
    return <span data-testid="location">{pathname + search}</span>;
};

const renderSelector = (
    props: {
        selectedYear: string | undefined;
        years: YearOption[];
    },
    initialEntries: string[] = ['/']
) =>
    render(
        <MemoryRouter initialEntries={initialEntries}>
            <YearSelector {...props} />
            <LocationProbe />
        </MemoryRouter>
    );

// The year text now sits in a span inside the link (the pill also carries a
// count), so these have to ask for the link itself rather than the text node.
const yearLink = (year: string) =>
    screen.getByRole('link', { name: new RegExp(`^${year}`) });

describe('YearSelector', () => {
    const years: YearOption[] = [
        { year: '1990', issues: 6, pages: 68 },
        { year: '1991', issues: 5, pages: 69 },
        { year: '1992', issues: 5, pages: 84 },
    ];
    const yearNames = years.map((y) => y.year);

    it('renders all provided years', () => {
        renderSelector({ selectedYear: undefined, years });
        yearNames.forEach((year) => {
            expect(yearLink(year)).toBeInTheDocument();
        });
    });

    it('marks the selected year as active', () => {
        renderSelector({ selectedYear: '1991', years });

        const activeLink = yearLink('1991');
        expect(activeLink).toHaveClass('active');
        expect(activeLink).toHaveAttribute('aria-current', 'page');

        const inactiveLink = yearLink('1990');
        expect(inactiveLink).not.toHaveClass('active');
        expect(inactiveLink).not.toHaveAttribute('aria-current');
    });

    it('links each year to its own route', () => {
        renderSelector({ selectedYear: undefined, years });
        expect(yearLink('1990')).toHaveAttribute('href', '/1990');
    });

    it('offers a link back to the whole archive, active when no year is selected', () => {
        renderSelector({ selectedYear: undefined, years });

        const allLink = yearLink('Mind');
        expect(allLink).toHaveAttribute('href', '/');
        expect(allLink).toHaveClass('active');
    });

    it('deactivates the "all" link once a year is selected', () => {
        renderSelector({ selectedYear: '1991', years });
        expect(yearLink('Mind')).not.toHaveClass('active');
    });

    // The pills only list years that matched the active filters, so dropping
    // the query string on navigation would discard the search that built them.
    it('carries the active filters into each year link', () => {
        renderSelector({ selectedYear: undefined, years }, [
            '/?q=iskola&author=Horv%C3%A1th%20Lajos',
        ]);

        const href = yearLink('1991').getAttribute('href') ?? '';
        expect(href).toContain('/1991?');
        expect(href).toContain('q=iskola');
        expect(href).toContain('author=Horv%C3%A1th+Lajos');
        expect(yearLink('Mind').getAttribute('href')).toContain('q=iskola');
    });

    it('drops the open image when switching years', () => {
        renderSelector({ selectedYear: undefined, years }, [
            '/?q=iskola&image=%2Fimages%2F1991%2F1991-04-01.jpg',
        ]);

        const href = yearLink('1991').getAttribute('href') ?? '';
        expect(href).toContain('q=iskola');
        expect(href).not.toContain('image=');
    });

    // How much is behind a pill, before you spend a click on it.
    it('says how much each year holds', () => {
        renderSelector({ selectedYear: undefined, years });

        expect(yearLink('1990')).toHaveTextContent('6 lapszám');
        // "Mind" counts pages rather than issues, summed across the years shown.
        expect(yearLink('Mind')).toHaveTextContent('221 oldal');
    });

    // Below 620px the pills are replaced by this; it has to navigate the same
    // way, filters and all, or the phone loses year browsing entirely.
    describe('the phone picker', () => {
        it('lists every year plus the whole archive', () => {
            renderSelector({ selectedYear: '1991', years });

            const select = screen.getByLabelText('Évszám') as HTMLSelectElement;
            expect(select.value).toBe('1991');
            expect(
                [...select.options].map((o) => o.value)
            ).toEqual(['', '1990', '1991', '1992']);
        });

        it('navigates to the chosen year, keeping the filters', () => {
            renderSelector({ selectedYear: undefined, years }, ['/?q=iskola']);

            fireEvent.change(screen.getByLabelText('Évszám'), {
                target: { value: '1992' },
            });

            expect(screen.getByTestId('location')).toHaveTextContent(
                '/1992?q=iskola'
            );
        });

        it('goes back to the whole archive on "Mind"', () => {
            renderSelector({ selectedYear: '1992', years }, ['/1992?q=iskola']);

            fireEvent.change(screen.getByLabelText('Évszám'), {
                target: { value: '' },
            });

            expect(screen.getByTestId('location')).toHaveTextContent('/?q=iskola');
        });
    });
});
