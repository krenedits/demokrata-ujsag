import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import fileList from '../../fileList.json';
import ImageGallery from './index';

// Smoke coverage for the gallery container itself. Every other test here covers
// a leaf component, so a crash in the container — e.g. hooks resolving against a
// second React instance, which took the whole page down once — stayed invisible
// until the app was opened in a browser.
//
// The gallery renders the whole archive up front, so jsdom sees every year,
// issue and card. That's what lets the counts below act as a real regression
// net: a virtualized build once silently dropped the last three years' headers
// and several whole issues, and nothing in this file caught it.
const renderGallery = (initialEntries: string[] = ['/']) =>
    render(
        <MemoryRouter initialEntries={initialEntries}>
            <Routes>
                <Route path="/" element={<ImageGallery />} />
                <Route path="/:year" element={<ImageGallery />} />
            </Routes>
        </MemoryRouter>
    );

// Derived from the data rather than hardcoded, so growing the archive doesn't
// turn these into false failures.
const archive = Object.entries(
    fileList as Record<string, Record<string, unknown[]>>
)
    .map(([year, releases]) => ({
        year,
        releases: Object.keys(releases).length,
        images: Object.values(releases).reduce(
            (sum, pages) => sum + pages.length,
            0
        ),
    }))
    .sort((a, b) => a.year.localeCompare(b.year));

const years = archive.map((entry) => entry.year);
const totalReleases = archive.reduce((sum, e) => sum + e.releases, 0);
const totalImages = archive.reduce((sum, e) => sum + e.images, 0);
const lastYear = archive[archive.length - 1]!;

describe('ImageGallery', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        document.title = '';
    });

    it('mounts without crashing and renders its filter controls', () => {
        expect(() => renderGallery()).not.toThrow();

        expect(screen.getByLabelText('Szöveg keresése:')).toBeInTheDocument();
        expect(screen.getByLabelText('Szerző keresése:')).toBeInTheDocument();
        expect(screen.getByLabelText('Cikk cím keresése:')).toBeInTheDocument();
    });

    // A year reads twice on the page — once as a navigation pill, once as the
    // section header — so these assertions target the pill by role.
    const yearPill = (year: string) => screen.getByRole('link', { name: year });

    it('lists the archive years, so the data actually reached the render', () => {
        renderGallery();
        expect(yearPill('1989')).toBeInTheDocument();
    });

    // The bug this guards against: the last years' headers stopped rendering
    // while their images kept showing, so the pages under "1995" were actually
    // 1996-1998's. Asserting the headers alone wouldn't have caught the
    // matching item-offset half of it, hence the article/image counts too.
    it('renders a header for every year, with every issue and page', () => {
        const { container } = renderGallery();

        const headers = container.querySelectorAll('h2.year-section-title');
        expect([...headers].map((h) => h.textContent)).toEqual(years);

        expect(container.querySelectorAll('article.release-row')).toHaveLength(
            totalReleases
        );
        expect(container.querySelectorAll('.year-images img')).toHaveLength(
            totalImages
        );
    });

    it('narrows to a single year on a year route', () => {
        const { container } = renderGallery([`/${lastYear.year}`]);

        const headers = container.querySelectorAll('h2.year-section-title');
        expect([...headers].map((h) => h.textContent)).toEqual([lastYear.year]);

        expect(container.querySelectorAll('article.release-row')).toHaveLength(
            lastYear.releases
        );
        expect(container.querySelectorAll('.year-images img')).toHaveLength(
            lastYear.images
        );
    });

    it('does not show the no-results state when nothing is filtered', () => {
        renderGallery();
        expect(
            screen.queryByText('Nincs találat a megadott szűrőkre.')
        ).not.toBeInTheDocument();
    });

    it('marks the routed year as active and titles the page after it', () => {
        renderGallery(['/1993']);

        expect(yearPill('1993')).toHaveClass('active');
        expect(screen.getByText('Mind')).not.toHaveClass('active');
        expect(document.title).toBe('1993 — Demokrata Újság Archívum');
    });

    it('falls back to the whole archive for a year that does not exist', () => {
        renderGallery(['/2050']);

        expect(screen.getByText('Mind')).toHaveClass('active');
        expect(document.title).toBe('Demokrata Újság Archívum');
    });

    it('reads filters out of the URL so a shared link keeps them', () => {
        renderGallery(['/?author=Horv%C3%A1th%20Lajos']);

        expect(screen.getByLabelText('Szerző keresése:')).toHaveValue(
            'Horváth Lajos'
        );
    });

    it('debounces a search, lazily fetches the index, then reports no results', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });

        const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
        vi.stubGlobal('fetch', fetchMock);

        renderGallery();

        fireEvent.change(screen.getByLabelText('Szöveg keresése:'), {
            target: { value: 'zzzznincsilyen' },
        });

        // Not fetched yet — the term is still inside the debounce window.
        expect(fetchMock).not.toHaveBeenCalled();

        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
        expect(String(fetchMock.mock.calls[0][0])).toContain('searchIndex.json');

        await waitFor(() => {
            expect(
                screen.getByText('Nincs találat a megadott szűrőkre.')
            ).toBeInTheDocument();
        });
        expect(
            screen.getByRole('button', { name: 'Szűrők törlése' })
        ).toBeInTheDocument();
    });

    // The search box syncs both ways: the URL feeds the input, and typing is
    // committed back on a debounce. Guards against those two effects fighting
    // each other — the failure mode is a render loop or a reverted keystroke.
    it('settles after a debounced search instead of looping', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
        );

        renderGallery();
        const input = screen.getByLabelText('Szöveg keresése:');

        fireEvent.change(input, { target: { value: 'szabadság' } });
        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        // The typed value survives the round-trip through the URL...
        expect(input).toHaveValue('szabadság');

        // ...and stays put once more timers drain, i.e. nothing is rewriting it.
        await act(async () => {
            vi.advanceTimersByTime(1000);
        });
        expect(input).toHaveValue('szabadság');
    });

    // A stale ?image= used to open a modal around a broken <img> and put
    // ". 0. szám, 0. oldal" in the tab title.
    it('ignores an ?image= that does not resolve to a real page', () => {
        renderGallery(['/?image=%2Fimages%2F2050%2F2050-99-99.jpg']);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(document.title).toBe('Demokrata Újság Archívum');
    });

    // A failed index fetch used to leave an empty index behind, which rendered
    // the ordinary "no results" state — indistinguishable from a real miss.
    it('reports a failed search index instead of claiming no results', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({ ok: false, status: 404 })
        );

        renderGallery();
        fireEvent.change(screen.getByLabelText('Szöveg keresése:'), {
            target: { value: 'szabadság' },
        });
        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        await waitFor(() => {
            expect(
                screen.getByText('A keresési index nem tölthető be. Próbáld újra.')
            ).toBeInTheDocument();
        });
        expect(
            screen.queryByText('Nincs találat a megadott szűrőkre.')
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Újrapróbálkozás' })
        ).toBeInTheDocument();
    });

    // ?image= and the filter params share one query string, so a link carrying
    // both has to drive the viewer and the filters at the same time.
    it('opens the viewer while keeping filters from the same URL', () => {
        renderGallery([
            '/1989?author=Horv%C3%A1th%20Lajos&image=%2Fimages%2F1989%2F1989-01-01.jpg',
        ]);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByLabelText('Szerző keresése:')).toHaveValue(
            'Horváth Lajos'
        );
        expect(yearPill('1989')).toHaveClass('active');
    });
});
