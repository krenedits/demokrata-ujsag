import '@testing-library/jest-dom';

// jsdom ships no matchMedia, but the app reads it during render (reduced-motion
// for the viewer's zoom transition) and to decide whether the WebP rendition is
// in play. Without a stub every component touching either path throws.
if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
}

// jsdom implements no PointerEvent either. Without this, fireEvent.pointerDown
// still fires the handler but silently drops clientX/clientY/pointerId, so any
// gesture assertion comparing coordinates passes on NaN rather than on
// behaviour — a test that can never fail. Subclassing MouseEvent gets the
// coordinates back.
if (typeof window.PointerEvent === 'undefined') {
    class PointerEventPolyfill extends MouseEvent {
        public readonly pointerId: number;
        public readonly pointerType: string;
        public readonly isPrimary: boolean;

        constructor(type: string, params: PointerEventInit = {}) {
            super(type, params);
            this.pointerId = params.pointerId ?? 0;
            this.pointerType = params.pointerType ?? 'mouse';
            this.isPrimary = params.isPrimary ?? true;
        }
    }
    window.PointerEvent = PointerEventPolyfill as unknown as typeof window.PointerEvent;
}

// Pointer capture is unimplemented in jsdom; the viewer calls it optionally, but
// stubbing it means tests exercise the same path a browser takes.
if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = function setPointerCapture() {};
    Element.prototype.releasePointerCapture = function releasePointerCapture() {};
    Element.prototype.hasPointerCapture = function hasPointerCapture() {
        return false;
    };
}
