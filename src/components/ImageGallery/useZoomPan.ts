import { useCallback, useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../utils';

export const MIN_SCALE = 1;
export const MAX_SCALE = 4;
/** What a double-click/double-tap jumps to: enough to read body text. */
export const DOUBLE_TAP_SCALE = 2.5;
const ZOOM_STEP = 1.4;

/** Past this much horizontal travel a fit-level drag counts as a page turn. */
const SWIPE_THRESHOLD_PX = 50;
/** ...but only if it's more horizontal than vertical, so scrolling isn't paging. */
const SWIPE_DIRECTION_RATIO = 1.2;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SLOP_PX = 30;

interface Transform {
    scale: number;
    x: number;
    y: number;
}

const IDENTITY: Transform = { scale: MIN_SCALE, x: 0, y: 0 };

/**
 * How far above fit still counts as fit.
 *
 * Pinch scales are raw float arithmetic (`startScale * distance / startDistance`),
 * so pinching out and back lands on something like 1.0000003 rather than 1. That
 * is indistinguishable from fit on screen and the readout still rounds it to
 * "100%", but it is enough to make `isZoomed` true — which switches the cursor to
 * `grab`, enables "Eredeti méret", and, worse, turns the one-finger drag from a
 * page turn into a pan whose clamp bounds are ~0. The scan then looks frozen and
 * the only way out is a control the reader has no reason to press.
 *
 * 0.005 rather than a smaller epsilon because that is exactly the band the
 * readout rounds down to 100%: past this, `isZoomed` and the readout can never
 * disagree.
 */
const SCALE_EPSILON = 0.005;

/** Anything the readout would still call "100%" is fit, not a zoom. */
const isFitScale = (scale: number) => scale < MIN_SCALE + SCALE_EPSILON;

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

interface UseZoomPanOptions {
    /** Reset to fit whenever this changes — a new page must never inherit a zoom. */
    resetKey: string | null;
    /**
     * Natural width/height of the scan on screen. The viewport box is not always
     * the scan's shape (a phone's flex height plus `max-width: 100%` can leave it
     * taller than the ratio), and `object-fit: contain` then letterboxes inside
     * it — so pan bounds have to come from the rendered image, not the box.
     */
    contentRatio: number;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
}

/**
 * Zoom/pan for the scan viewer, plus the swipe-to-page gesture that shares the
 * same pointer stream.
 *
 * The two are one hook rather than two because they compete for the same
 * one-finger drag: at fit level a horizontal drag pages, and once zoomed in the
 * identical gesture has to pan instead. Splitting them would mean two handlers
 * arbitrating over shared state.
 */
export const useZoomPan = ({
    resetKey,
    contentRatio,
    onSwipeLeft,
    onSwipeRight,
}: UseZoomPanOptions) => {
    const [transform, setTransform] = useState<Transform>(IDENTITY);
    const [isDragging, setIsDragging] = useState(false);

    const targetRef = useRef<HTMLElement | null>(null);
    // Live pointers, so a second finger can promote a drag into a pinch.
    const pointersRef = useRef(new Map<number, { x: number; y: number }>());
    const gestureRef = useRef<{
        startX: number;
        startY: number;
        originX: number;
        originY: number;
        moved: boolean;
    } | null>(null);
    const pinchRef = useRef<{ distance: number; scale: number } | null>(null);
    const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
    /** Which device drove the last gesture, so dblclick can be filtered by it. */
    const lastPointerTypeRef = useRef<string>('mouse');
    // Read inside pointerup without making the handler depend on the transform.
    const transformRef = useRef(transform);
    transformRef.current = transform;
    // A ref, so a newly measured ratio doesn't rebuild clampOffset -> zoomTo ->
    // the native wheel listener on every page load.
    const contentRatioRef = useRef(contentRatio);
    contentRatioRef.current = contentRatio;

    const isZoomed = !isFitScale(transform.scale);

    /**
     * Keeps the scan's own edges from being dragged inside the viewport, so it
     * can never be flung off-screen leaving an empty modal — and, at fit, can't
     * be dragged at all.
     */
    const clampOffset = useCallback(
        (x: number, y: number, scale: number): { x: number; y: number } => {
            const el = targetRef.current;
            if (!el) {
                return { x: 0, y: 0 };
            }
            // Layout size, i.e. before the transform — getBoundingClientRect
            // would already include the scale and compound on every move.
            const boxW = el.offsetWidth;
            const boxH = el.offsetHeight;
            // What `object-fit: contain` actually paints inside that box. When
            // the box is taller than the scan (a phone, where the flexed height
            // and `max-width: 100%` don't have to agree with the ratio) the
            // letterboxing is dead space, and bounds taken from the box would
            // let a magnified scan be dragged ~100px past its own edge into it.
            const ratio = contentRatioRef.current;
            let contentW = boxW;
            let contentH = boxH;
            if (ratio > 0 && boxW > 0 && boxH > 0) {
                if (ratio > boxW / boxH) {
                    contentH = boxW / ratio;
                } else {
                    contentW = boxH * ratio;
                }
            }
            const maxX = Math.max(0, (contentW * scale - boxW) / 2);
            const maxY = Math.max(0, (contentH * scale - boxH) / 2);
            return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
        },
        []
    );

    const reset = useCallback(() => {
        setTransform(IDENTITY);
    }, []);

    /**
     * Zooms so the point under (clientX, clientY) stays put. Without the anchor
     * maths, zooming always drifts toward the centre and you lose the column you
     * were reading.
     */
    const zoomTo = useCallback(
        (nextScaleRaw: number, clientX?: number, clientY?: number) => {
            setTransform((prev) => {
                const next = clamp(nextScaleRaw, MIN_SCALE, MAX_SCALE);
                // Snap the fit band to exactly fit, so a pinch can never leave
                // the viewer in the state where it reads "100%" but behaves as
                // though it were zoomed. Returning `prev` when it is already
                // exactly fit keeps a settling pinch from re-rendering.
                if (isFitScale(next)) {
                    return prev.scale === MIN_SCALE && prev.x === 0 && prev.y === 0
                        ? prev
                        : IDENTITY;
                }
                if (next === prev.scale) {
                    return prev;
                }

                const el = targetRef.current;
                let px = 0;
                let py = 0;
                if (el && clientX !== undefined && clientY !== undefined) {
                    const rect = el.getBoundingClientRect();
                    px = clientX - (rect.left + rect.width / 2);
                    py = clientY - (rect.top + rect.height / 2);
                }

                const ratio = next / prev.scale;
                const offset = clampOffset(
                    px - (px - prev.x) * ratio,
                    py - (py - prev.y) * ratio,
                    next
                );
                return { scale: next, ...offset };
            });
        },
        [clampOffset]
    );

    const zoomIn = useCallback(
        () => zoomTo(transformRef.current.scale * ZOOM_STEP),
        [zoomTo]
    );
    const zoomOut = useCallback(
        () => zoomTo(transformRef.current.scale / ZOOM_STEP),
        [zoomTo]
    );

    const toggleZoom = useCallback(
        (clientX?: number, clientY?: number) => {
            if (!isFitScale(transformRef.current.scale)) {
                reset();
            } else {
                zoomTo(DOUBLE_TAP_SCALE, clientX, clientY);
            }
        },
        [reset, zoomTo]
    );

    // A new page (or closing) starts from fit, never inheriting the last zoom.
    useEffect(() => {
        setTransform(IDENTITY);
        pointersRef.current.clear();
        gestureRef.current = null;
        pinchRef.current = null;
        setIsDragging(false);
    }, [resetKey]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        lastPointerTypeRef.current = e.pointerType;

        // Capture every pointer, including the second finger of a pinch. Without
        // it, a finger lifted outside the viewport — routine when pinching out,
        // where fingers travel past the image — never fires pointerup here, so
        // its id would linger in the map and make the next single touch look
        // like a pinch, deadening pan, swipe and double-tap until the page
        // changed.
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointersRef.current.size === 2) {
            // Second finger down: abandon the drag, start a pinch.
            const [a, b] = [...pointersRef.current.values()];
            if (a && b) {
                pinchRef.current = {
                    distance: Math.hypot(b.x - a.x, b.y - a.y),
                    scale: transformRef.current.scale,
                };
            }
            gestureRef.current = null;
            setIsDragging(false);
            return;
        }

        if (pointersRef.current.size > 2) {
            return;
        }

        gestureRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            originX: transformRef.current.x,
            originY: transformRef.current.y,
            moved: false,
        };
        setIsDragging(true);
    }, []);

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!pointersRef.current.has(e.pointerId)) {
                return;
            }
            pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

            const pinch = pinchRef.current;
            if (pinch && pointersRef.current.size === 2) {
                const [a, b] = [...pointersRef.current.values()];
                if (!a || !b) {
                    return;
                }
                const distance = Math.hypot(b.x - a.x, b.y - a.y);
                if (pinch.distance > 0) {
                    zoomTo(
                        pinch.scale * (distance / pinch.distance),
                        (a.x + b.x) / 2,
                        (a.y + b.y) / 2
                    );
                }
                return;
            }

            const gesture = gestureRef.current;
            if (!gesture) {
                return;
            }

            const dx = e.clientX - gesture.startX;
            const dy = e.clientY - gesture.startY;
            if (!gesture.moved && Math.hypot(dx, dy) > 3) {
                gesture.moved = true;
            }

            // At fit level the drag is a potential page turn, so the image must
            // not follow the finger — otherwise it slides and springs back.
            if (isFitScale(transformRef.current.scale)) {
                return;
            }

            setTransform((prev) => ({
                scale: prev.scale,
                ...clampOffset(gesture.originX + dx, gesture.originY + dy, prev.scale),
            }));
        },
        [clampOffset, zoomTo]
    );

    const endPointer = useCallback(
        (e: React.PointerEvent) => {
            pointersRef.current.delete(e.pointerId);
            if (pointersRef.current.size < 2) {
                pinchRef.current = null;
            }

            const gesture = gestureRef.current;
            gestureRef.current = null;
            setIsDragging(false);
            if (!gesture) {
                return;
            }

            const dx = e.clientX - gesture.startX;
            const dy = e.clientY - gesture.startY;

            // Paging only at fit level: once zoomed in the same drag panned, and
            // turning the page underneath the reader would feel broken.
            if (isFitScale(transformRef.current.scale)) {
                if (
                    Math.abs(dx) > SWIPE_THRESHOLD_PX &&
                    Math.abs(dx) > Math.abs(dy) * SWIPE_DIRECTION_RATIO
                ) {
                    if (dx < 0) {
                        onSwipeLeft();
                    } else {
                        onSwipeRight();
                    }
                    lastTapRef.current = null;
                    return;
                }
            }

            if (gesture.moved) {
                return;
            }

            // Mouse gets its double-click from the browser's own dblclick event.
            // Pairing taps here as well would toggle the zoom twice per
            // double-click — in and straight back out, so it appears dead.
            if (e.pointerType === 'mouse') {
                return;
            }

            // Pair two quick taps ourselves rather than relying on dblclick,
            // whose delivery for touch varies between browsers. Chrome does
            // send it after a double tap even under `touch-action: none`
            // (measured with real touch events), which is why handleDoubleClick
            // below ignores touch — otherwise both paths fire, one toggling the
            // zoom in and the other straight back out, so it looks dead.
            const now = Date.now();
            const last = lastTapRef.current;
            if (
                last &&
                now - last.time < DOUBLE_TAP_MS &&
                Math.hypot(e.clientX - last.x, e.clientY - last.y) < DOUBLE_TAP_SLOP_PX
            ) {
                lastTapRef.current = null;
                toggleZoom(e.clientX, e.clientY);
                return;
            }
            lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };
        },
        [onSwipeLeft, onSwipeRight, toggleZoom]
    );

    /**
     * Wheel has to be a native non-passive listener: React's onWheel is passive,
     * so preventDefault there is ignored and the browser page-zooms instead.
     */
    useEffect(() => {
        const el = targetRef.current;
        if (!el) {
            return;
        }
        const handleWheel = (e: WheelEvent) => {
            // Ctrl/Cmd+wheel is the browser's own page zoom, and on an archive
            // of scanned text that is a real accessibility affordance — the
            // keyboard handler already leaves Ctrl/Cmd +/-/0 alone for exactly
            // this reason, and swallowing it here contradicted that. The cost
            // is that a trackpad pinch (which browsers report as ctrl+wheel)
            // zooms the page rather than the scan; for these readers that is
            // the better trade, and touch pinch, the toolbar and +/- all still
            // zoom the scan itself.
            if (e.ctrlKey || e.metaKey) {
                return;
            }
            e.preventDefault();
            const factor = Math.exp(-e.deltaY / 300);
            zoomTo(transformRef.current.scale * factor, e.clientX, e.clientY);
        };
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
        // resetKey remounts the image element, so the listener must reattach.
    }, [zoomTo, resetKey]);

    const setTarget = useCallback((el: HTMLElement | null) => {
        targetRef.current = el;
    }, []);

    /** The browser's own double-click, which we only want from a mouse. */
    const handleDoubleClick = useCallback(
        (e: React.MouseEvent) => {
            if (lastPointerTypeRef.current !== 'mouse') {
                return;
            }
            toggleZoom(e.clientX, e.clientY);
        },
        [toggleZoom]
    );

    return {
        scale: transform.scale,
        isZoomed,
        isDragging,
        setTarget,
        zoomIn,
        zoomOut,
        reset,
        toggleZoom,
        style: {
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transition:
                isDragging || prefersReducedMotion()
                    ? 'none'
                    : 'transform 160ms ease-out',
        } as React.CSSProperties,
        handlers: {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: endPointer,
            onPointerCancel: endPointer,
            onDoubleClick: handleDoubleClick,
        },
    };
};
