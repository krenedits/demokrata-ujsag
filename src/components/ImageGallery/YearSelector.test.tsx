import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import YearSelector from './YearSelector';

const renderSelector = (
    props: {
        selectedYear: string | undefined;
        filteredYears: string[];
    },
    initialEntries: string[] = ['/']
) =>
    render(
        <MemoryRouter initialEntries={initialEntries}>
            <YearSelector {...props} />
        </MemoryRouter>
    );

describe('YearSelector', () => {
    const filteredYears = ['1990', '1991', '1992'];

    it('renders all provided years', () => {
        renderSelector({ selectedYear: undefined, filteredYears });
        filteredYears.forEach((year) => {
            expect(screen.getByText(year)).toBeInTheDocument();
        });
    });

    it('marks the selected year as active', () => {
        renderSelector({ selectedYear: '1991', filteredYears });

        const activeLink = screen.getByText('1991');
        expect(activeLink).toHaveClass('active');
        expect(activeLink).toHaveAttribute('aria-current', 'page');

        const inactiveLink = screen.getByText('1990');
        expect(inactiveLink).not.toHaveClass('active');
        expect(inactiveLink).not.toHaveAttribute('aria-current');
    });

    it('links each year to its own route', () => {
        renderSelector({ selectedYear: undefined, filteredYears });
        expect(screen.getByText('1990')).toHaveAttribute('href', '/1990');
    });

    it('offers a link back to the whole archive, active when no year is selected', () => {
        renderSelector({ selectedYear: undefined, filteredYears });

        const allLink = screen.getByText('Mind');
        expect(allLink).toHaveAttribute('href', '/');
        expect(allLink).toHaveClass('active');
    });

    it('deactivates the "all" link once a year is selected', () => {
        renderSelector({ selectedYear: '1991', filteredYears });
        expect(screen.getByText('Mind')).not.toHaveClass('active');
    });

    // The pills only list years that matched the active filters, so dropping
    // the query string on navigation would discard the search that built them.
    it('carries the active filters into each year link', () => {
        renderSelector({ selectedYear: undefined, filteredYears }, [
            '/?q=iskola&author=Horv%C3%A1th%20Lajos',
        ]);

        const href = screen.getByText('1991').getAttribute('href') ?? '';
        expect(href).toContain('/1991?');
        expect(href).toContain('q=iskola');
        expect(href).toContain('author=Horv%C3%A1th+Lajos');
        expect(screen.getByText('Mind').getAttribute('href')).toContain(
            'q=iskola'
        );
    });

    it('drops the open image when switching years', () => {
        renderSelector({ selectedYear: undefined, filteredYears }, [
            '/?q=iskola&image=%2Fimages%2F1991%2F1991-04-01.jpg',
        ]);

        const href = screen.getByText('1991').getAttribute('href') ?? '';
        expect(href).toContain('q=iskola');
        expect(href).not.toContain('image=');
    });
});
