import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import fileList from '../../fileList.json';
import { FileList } from '../../types';
import FullSizeImage from './FullSizeImage';

// The viewer is where reading actually happens, so its gesture and loading
// behaviour carries real risk: zoom leaking across pages, a swipe firing while
// the reader is panning a magnified scan, or a placeholder that never clears.
// jsdom can't do real pinch or layout, but it can drive the pointer stream and
// the load events, which is where the logic lives.

const typed = fileList as FileList;

// Derived from the data so growing the archive can't turn these into false
// failures — and so the fixture is a page that really exists.
const [year, releases] = Object.entries(typed)[0]!;
const [release, pages] = Object.entries(releases)[0]!;
const firstPage = pages[0]!;
const secondPage = pages[1]!;

const renderViewer = (image: string, setSelectedImage = vi.fn()) => {
    const utils = render(
        <FullSizeImage
            selectedImage={image}
            setSelectedImage={setSelectedImage}
            selectedYear={year}
        />
    );
    return { ...utils, setSelectedImage };
};

const viewport = (container: HTMLElement) =>
    container.querySelector('.scan-viewport') as HTMLElement;

/** One-finger drag: down, a move past the slop, then up. */
const drag = (el: HTMLElement, dx: number, dy = 0) => {
    fireEvent.pointerDown(el, { pointerId: 1, clientX: 200, clientY: 200 });
    fireEvent.pointerMove(el, {
        pointerId: 1,
        clientX: 200 + dx,
        clientY: 200 + dy,
    });
    fireEvent.pointerUp(el, {
        pointerId: 1,
        clientX: 200 + dx,
        clientY: 200 + dy,
    });
};

/**
 * Two fingers down, spread, then back to *almost* the starting distance.
 *
 * The return leg lands on a diagonal so the distance is 200.0025 rather than
 * 200 — which is what a real pinch out and back produces, since the scale is
 * plain float arithmetic (`startScale * distance / startDistance`) and nothing
 * rounds it.
 */
const pinchOutAndBack = (el: HTMLElement) => {
    const touch = { pointerType: 'touch' } as const;
    fireEvent.pointerDown(el, { pointerId: 1, clientX: 100, clientY: 200, ...touch });
    fireEvent.pointerDown(el, { pointerId: 2, clientX: 300, clientY: 200, ...touch });
    // Spread to 400px apart: scale 2.
    fireEvent.pointerMove(el, { pointerId: 2, clientX: 500, clientY: 200, ...touch });
    // ...and back to hypot(200, 1) = 200.0025px apart: scale 1.0000125.
    fireEvent.pointerMove(el, { pointerId: 2, clientX: 300, clientY: 201, ...touch });
    fireEvent.pointerUp(el, { pointerId: 2, clientX: 300, clientY: 201, ...touch });
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 100, clientY: 200, ...touch });
};

const zoomLevel = () => screen.getByText(/%$/).textContent;

/**
 * Below 960px the <picture> serves the WebP derivative, which is the only case
 * where the missing-derivative fallback is in play. The shared setup stubs
 * matchMedia as a desktop, so the phone case has to say so explicitly.
 */
const mockPhoneViewport = () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
        (query: string) =>
            ({
                matches: query === '(max-width: 960px)',
                media: query,
                onchange: null,
                addEventListener: () => {},
                removeEventListener: () => {},
                addListener: () => {},
                removeListener: () => {},
                dispatchEvent: () => false,
            }) as unknown as MediaQueryList
    );
};

// The shared setup stubs matchMedia as "desktop, no reduced motion", which is
// what these tests want: the zoom-resolution upgrade only fires below 960px.
afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe('FullSizeImage zoom', () => {
    it('starts at fit and magnifies with the keyboard', () => {
        renderViewer(firstPage.image);

        expect(zoomLevel()).toBe('100%');

        fireEvent.keyDown(window, { key: '+' });
        expect(zoomLevel()).not.toBe('100%');
        expect(parseInt(zoomLevel()!, 10)).toBeGreaterThan(100);
    });

    it('returns to fit on "0" after zooming', () => {
        renderViewer(firstPage.image);

        fireEvent.keyDown(window, { key: '+' });
        expect(zoomLevel()).not.toBe('100%');

        fireEvent.keyDown(window, { key: '0' });
        expect(zoomLevel()).toBe('100%');
    });

    // Ctrl/Cmd +/-/0 is the browser's page zoom and a genuine accessibility
    // affordance on an archive of scanned text; the viewer must not claim it.
    it('leaves the browser zoom shortcuts alone', () => {
        renderViewer(firstPage.image);

        fireEvent.keyDown(window, { key: '+', ctrlKey: true });
        expect(zoomLevel()).toBe('100%');

        fireEvent.keyDown(window, { key: '+' });
        const zoomed = zoomLevel();
        expect(zoomed).not.toBe('100%');

        fireEvent.keyDown(window, { key: '0', metaKey: true });
        expect(zoomLevel()).toBe(zoomed);
    });

    it('will not zoom out below fit', () => {
        renderViewer(firstPage.image);

        fireEvent.keyDown(window, { key: '-' });
        expect(zoomLevel()).toBe('100%');
    });

    it('does not carry a zoom over to the next page', () => {
        const { rerender } = renderViewer(firstPage.image);

        fireEvent.keyDown(window, { key: '+' });
        expect(zoomLevel()).not.toBe('100%');

        rerender(
            <FullSizeImage
                selectedImage={secondPage.image}
                setSelectedImage={vi.fn()}
                selectedYear={year}
            />
        );

        expect(zoomLevel()).toBe('100%');
    });

    it('toggles zoom on double click', () => {
        const { container } = renderViewer(firstPage.image);

        fireEvent.doubleClick(viewport(container), { clientX: 100, clientY: 100 });
        expect(zoomLevel()).not.toBe('100%');

        fireEvent.doubleClick(viewport(container), { clientX: 100, clientY: 100 });
        expect(zoomLevel()).toBe('100%');
    });

    // A real mouse double-click emits the pointer pairs AND dblclick. Handling
    // both would toggle twice and leave the zoom exactly where it started, so
    // the feature would look dead while every isolated test still passed.
    it('zooms once for a full mouse double-click sequence', () => {
        const { container } = renderViewer(firstPage.image);
        const el = viewport(container);
        const at = { clientX: 100, clientY: 100, pointerType: 'mouse' };

        fireEvent.pointerDown(el, { pointerId: 1, ...at });
        fireEvent.pointerUp(el, { pointerId: 1, ...at });
        fireEvent.pointerDown(el, { pointerId: 1, ...at });
        fireEvent.pointerUp(el, { pointerId: 1, ...at });
        fireEvent.doubleClick(el, at);

        expect(zoomLevel()).not.toBe('100%');
    });

    // The state that made the viewer look broken on a phone: a pinch out and
    // back settles on 1.0000125, not 1. The readout still rounds that to 100%,
    // but every "am I zoomed?" test used to see a scale above fit — so the
    // cursor changed, "Eredeti méret" lit up, swipe-to-page died silently, and
    // the one-finger drag became a pan whose bounds were ~0 pixels wide. The
    // reader's only way out was a control they had no reason to press.
    it('settles back to exact fit after a pinch that lands just above it', () => {
        const { container } = renderViewer(firstPage.image);

        pinchOutAndBack(viewport(container));

        expect(zoomLevel()).toBe('100%');
        // The three things that must agree with that readout:
        expect(screen.getByLabelText('Eredeti méret')).toBeDisabled();
        expect(screen.getByLabelText('Kicsinyítés')).toBeDisabled();
        expect(viewport(container)).not.toHaveClass('is-zoomed');
    });

    it('still pages on a swipe after such a pinch', () => {
        const { container, setSelectedImage } = renderViewer(firstPage.image);

        pinchOutAndBack(viewport(container));
        drag(viewport(container), -120);

        expect(setSelectedImage).toHaveBeenCalledWith(secondPage.image);
    });

    // Touch gets no dblclick from the browser, so the tap pairing is the only
    // thing that can zoom — the mouse guard above must not disable it.
    it('zooms on a two-tap touch sequence', () => {
        const { container } = renderViewer(firstPage.image);
        const el = viewport(container);
        const at = { clientX: 100, clientY: 100, pointerType: 'touch' };

        fireEvent.pointerDown(el, { pointerId: 2, ...at });
        fireEvent.pointerUp(el, { pointerId: 2, ...at });
        fireEvent.pointerDown(el, { pointerId: 2, ...at });
        fireEvent.pointerUp(el, { pointerId: 2, ...at });

        expect(zoomLevel()).not.toBe('100%');
    });
});

describe('FullSizeImage swipe', () => {
    it('pages forward on a leftward swipe', () => {
        const { container, setSelectedImage } = renderViewer(firstPage.image);

        drag(viewport(container), -120);

        expect(setSelectedImage).toHaveBeenCalledWith(secondPage.image);
    });

    it('does not page back from the first page of an issue', () => {
        const { container, setSelectedImage } = renderViewer(firstPage.image);

        drag(viewport(container), 120);

        expect(setSelectedImage).not.toHaveBeenCalled();
    });

    it('pages back from the second page', () => {
        const { container, setSelectedImage } = renderViewer(secondPage.image);

        drag(viewport(container), 120);

        expect(setSelectedImage).toHaveBeenCalledWith(firstPage.image);
    });

    it('ignores a drag that is mostly vertical', () => {
        const { container, setSelectedImage } = renderViewer(firstPage.image);

        drag(viewport(container), -120, -300);

        expect(setSelectedImage).not.toHaveBeenCalled();
    });

    it('ignores a drag shorter than the swipe threshold', () => {
        const { container, setSelectedImage } = renderViewer(firstPage.image);

        drag(viewport(container), -20);

        expect(setSelectedImage).not.toHaveBeenCalled();
    });

    // The one that makes such viewers feel broken: once magnified, the same
    // one-finger drag has to move the scan, not turn the page.
    it('pans instead of paging while zoomed in', () => {
        const { container, setSelectedImage } = renderViewer(firstPage.image);

        fireEvent.keyDown(window, { key: '+' });
        drag(viewport(container), -120);

        expect(setSelectedImage).not.toHaveBeenCalled();
    });
});

describe('FullSizeImage loading', () => {
    it('shows the thumbnail as a placeholder until the scan loads', () => {
        const withThumb = pages.find((p) => p.image_k)!;
        const { container } = renderViewer(withThumb.image);

        const lqip = container.querySelector('.scan-lqip') as HTMLImageElement;
        expect(lqip).toBeInTheDocument();
        expect(lqip.getAttribute('src')).toContain(
            withThumb.image_k!.replace(/^\//, '')
        );

        const full = container.querySelector('.scan-full') as HTMLImageElement;
        expect(full).not.toHaveClass('is-loaded');

        act(() => {
            fireEvent.load(full);
        });

        expect(container.querySelector('.scan-full')).toHaveClass('is-loaded');
    });

    // .scan-full fades in over 200ms. Unmounting the placeholder the instant
    // the load event arrives flashed the bare panel through the transparent
    // viewport for that whole fade — on every single page turn, which is the
    // one thing a placeholder exists to prevent.
    it('keeps the placeholder up until the scan has actually faded in', () => {
        vi.useFakeTimers();
        const withThumb = pages.find((p) => p.image_k)!;
        const { container } = renderViewer(withThumb.image);
        const full = container.querySelector('.scan-full') as HTMLImageElement;

        act(() => {
            fireEvent.load(full);
        });

        expect(container.querySelector('.scan-lqip')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(200);
        });

        // Still up at the nominal end of the fade: the timer carries slack,
        // because without it the compositor was a frame behind and one frame
        // rendered at 0.988 opacity over nothing.
        expect(container.querySelector('.scan-lqip')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(150);
        });

        expect(container.querySelector('.scan-lqip')).not.toBeInTheDocument();
    });

    it('falls back to a spinner for the pages that have no thumbnail', () => {
        // 8 of 545 pages genuinely lack one, so this branch is reachable.
        const noThumb = Object.values(typed)
            .flatMap((r) => Object.values(r))
            .flat()
            .find((p) => !p.image_k);

        if (!noThumb) {
            // Data changed; the placeholder branch above already covers the rest.
            return;
        }

        const parsedYear = noThumb.image.split('/')[2]!;
        render(
            <FullSizeImage
                selectedImage={noThumb.image}
                setSelectedImage={vi.fn()}
                selectedYear={parsedYear}
            />
        );

        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('takes its aspect ratio from the file, not a hardcoded one', () => {
        const { container } = renderViewer(firstPage.image);
        const full = container.querySelector('.scan-full') as HTMLImageElement;

        // The archive has one landscape scan, so a fixed ratio would letterbox
        // it wrongly; the box follows whatever the file reports.
        Object.defineProperty(full, 'naturalWidth', { value: 1755, configurable: true });
        Object.defineProperty(full, 'naturalHeight', { value: 1275, configurable: true });

        act(() => {
            fireEvent.load(full);
        });

        expect(viewport(container).style.aspectRatio).toBe('1755 / 1275');
    });

    // Verified in Chrome: a <picture> does NOT fall back to its <img src> when
    // the chosen <source> 404s — it keeps the missing file as currentSrc with
    // naturalWidth 0. Combined with onError clearing the placeholder, a missing
    // derivative rendered a blank viewport instead of the original scan.
    it('falls back to the original when the WebP rendition is missing', () => {
        mockPhoneViewport();
        const { container } = renderViewer(firstPage.image);

        expect(container.querySelector('source')).toBeInTheDocument();

        const full = container.querySelector('.scan-full') as HTMLImageElement;
        // jsdom loads nothing, so the browser's choice of candidate has to be
        // stated explicitly: this is the WebP <source> having been picked.
        Object.defineProperty(full, 'currentSrc', {
            value: `/demokrata-ujsag/${firstPage.image.replace(/\.jpe?g$/i, '_m.webp')}`,
            configurable: true,
        });

        act(() => {
            fireEvent.error(full);
        });

        // Dropping the <source> is what makes the browser re-resolve to the
        // JPEG in `src`; the placeholder must stay up until that lands.
        expect(container.querySelector('source')).not.toBeInTheDocument();
        expect(container.querySelector('.scan-full')).not.toHaveClass('is-loaded');
    });

    // The branch used to be chosen by testing currentSrc against /_m\.webp$/.
    // currentSrc is the empty string when the error arrives before the browser
    // has resolved a candidate — an aborted connection, and some non-Chromium
    // paths — so a phone whose derivative was merely missing fell through to
    // the terminal branch: the <source> was never dropped, the placeholder was
    // cleared, and the reader got a blank box for a scan that was there.
    it('drops the WebP source even when currentSrc never resolved', () => {
        mockPhoneViewport();
        const { container } = renderViewer(firstPage.image);
        const full = container.querySelector('.scan-full') as HTMLImageElement;

        Object.defineProperty(full, 'currentSrc', { value: '', configurable: true });

        act(() => {
            fireEvent.error(full);
        });

        expect(container.querySelector('source')).not.toBeInTheDocument();
        expect(container.querySelector('.scan-full')).not.toHaveClass('is-loaded');
    });

    // ...and the retry after that must terminate, not bounce between branches.
    it('gives up once the original fails on a phone too', () => {
        mockPhoneViewport();
        const { container } = renderViewer(firstPage.image);
        const full = container.querySelector('.scan-full') as HTMLImageElement;

        Object.defineProperty(full, 'currentSrc', { value: '', configurable: true });

        act(() => {
            fireEvent.error(full);
        });
        act(() => {
            fireEvent.error(
                container.querySelector('.scan-full') as HTMLImageElement
            );
        });

        expect(container.querySelector('.scan-full')).toHaveClass('is-loaded');
    });

    it('gives up when the original fails too, rather than waiting forever', () => {
        const { container } = renderViewer(firstPage.image);
        const full = container.querySelector('.scan-full') as HTMLImageElement;

        Object.defineProperty(full, 'currentSrc', {
            value: `/demokrata-ujsag/${firstPage.image}`,
            configurable: true,
        });

        act(() => {
            fireEvent.error(full);
        });

        // No further load event is coming, so the placeholder has to clear or
        // the reader is left staring at a blur with no sign anything is wrong.
        expect(container.querySelector('.scan-full')).toHaveClass('is-loaded');
    });
});

describe('FullSizeImage existing behaviour still holds', () => {
    it('keeps arrow-key paging', () => {
        const { setSelectedImage } = renderViewer(firstPage.image);

        fireEvent.keyDown(window, { key: 'ArrowRight' });

        expect(setSelectedImage).toHaveBeenCalledWith(secondPage.image);
    });

    it('closes on Escape', () => {
        const { setSelectedImage } = renderViewer(firstPage.image);

        fireEvent.keyDown(window, { key: 'Escape' });

        expect(setSelectedImage).toHaveBeenCalledWith(null);
    });

    it('exposes the scan in a labelled dialog', () => {
        renderViewer(firstPage.image);

        expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
        expect(
            screen.getByAltText(new RegExp(`${year}\\..*oldal`))
        ).toBeInTheDocument();
    });

    // The filenames are zero-padded, the caption strips the padding with unary
    // +, and the alt text used not to — so a screen reader heard "1989. - 01.
    // szám - 001. oldal" for a page captioned "1989. - 1. szám - 1. oldal".
    it('describes the scan with the same numbering the caption shows', () => {
        const { container } = renderViewer(firstPage.image);

        const alt = (container.querySelector('.scan-full') as HTMLImageElement).alt;
        const caption = container.querySelector('.panel-caption')!.textContent!;

        expect(alt).toBe(caption.trim());
        expect(alt).not.toMatch(/\b0\d/);
    });

    // aria-live on the visible readout fired on every wheel tick and every
    // pinch pointermove, queueing dozens of utterances for one gesture.
    it('announces the zoom level once the gesture settles', () => {
        vi.useFakeTimers();
        const { container } = renderViewer(firstPage.image);
        const live = container.querySelector('[aria-live="polite"]')!;

        expect(live.textContent).toContain('100');

        act(() => {
            fireEvent.keyDown(window, { key: '+' });
        });
        act(() => {
            fireEvent.keyDown(window, { key: '+' });
        });

        // Mid-gesture: the visible readout has moved, the announcement has not.
        expect(zoomLevel()).not.toBe('100%');
        expect(live.textContent).toContain('100');

        act(() => {
            vi.advanceTimersByTime(600);
        });

        expect(live.textContent).toContain(zoomLevel()!.replace('%', ''));
    });

    it('disables the previous button on the first page of an issue', () => {
        renderViewer(firstPage.image);

        expect(screen.getByLabelText('Előző oldal')).toBeDisabled();
        expect(screen.getByLabelText('Következő oldal')).not.toBeDisabled();
    });
});

describe(`fixture sanity (${year}/${release})`, () => {
    it('uses an issue with at least two pages so paging is testable', () => {
        expect(pages.length).toBeGreaterThan(1);
    });
});
