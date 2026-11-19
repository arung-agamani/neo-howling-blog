import { useEffect } from "react";

/**
 * How far past the fold the status row may be and still count as "the writer
 * is at the end". Measured from the row's rect, so it does not depend on
 * identifying a particular scroll container.
 */
const FOLLOW_WINDOW_PX = 160;

/** A scroll position is "moving up" beyond this many pixels. */
const SCROLL_UP_EPSILON_PX = 2;

/**
 * Follow only while the writer is in the editor, any part of the row is past
 * the visible bottom edge, and the writer has not scrolled up.
 *
 * `hidden > 0` is deliberately "one pixel is enough": the row does not have
 * to disappear for the page to follow, it only has to start leaving.
 */
export function shouldFollowByRect(params: {
    statusBarBottom: number;
    visibleBottom: number;
    isEditorFocused: boolean;
    userScrolledUp: boolean;
    window?: number;
}): boolean {
    if (params.userScrolledUp) return false;

    const hidden = params.statusBarBottom - params.visibleBottom;
    const limit = params.window ?? FOLLOW_WINDOW_PX;
    return params.isEditorFocused && hidden > 0 && hidden <= limit;
}

/** True when a scroll moved upward (previous position was larger). */
export function isScrollUp(previousTop: number, currentTop: number): boolean {
    return currentTop < previousTop - SCROLL_UP_EPSILON_PX;
}

/** True when a scroll position has reached the end of its range. */
export function isAtScrollEnd(
    scrollTop: number,
    clientHeight: number,
    scrollHeight: number,
    epsilon = 2,
): boolean {
    return scrollTop + clientHeight >= scrollHeight - epsilon;
}

/**
 * True when every scrollable ancestor (and the document) has reached its end.
 * Reaching the very bottom is the explicit "I am done reading" gesture that
 * lifts the scroll-up suspension.
 */
function isChainAtBottom(element: HTMLElement): boolean {
    let node = element.parentElement;
    while (node && node !== document.body) {
        const { overflowY } = window.getComputedStyle(node);
        if (
            /(auto|scroll|overlay)/.test(overflowY) &&
            node.scrollHeight > node.clientHeight + 1 &&
            !isAtScrollEnd(node.scrollTop, node.clientHeight, node.scrollHeight)
        ) {
            return false;
        }
        node = node.parentElement;
    }

    const documentScroller =
        (document.scrollingElement as HTMLElement | null) ??
        document.documentElement;
    if (
        documentScroller.scrollHeight > documentScroller.clientHeight + 1 &&
        !isAtScrollEnd(
            window.scrollY,
            window.innerHeight,
            documentScroller.scrollHeight,
        )
    ) {
        return false;
    }

    return true;
}

/**
 * Bottom edge of the area that actually clips the editor. `window.innerHeight`
 * alone is wrong when a nested scroll container (or any clipping ancestor)
 * ends above the window edge: the row can be visually gone while still being
 * inside the window box.
 */
function getVisibleBottom(element: HTMLElement): number {
    let bottom = window.innerHeight;

    let node = element.parentElement;
    while (node && node !== document.body) {
        const { overflowY } = window.getComputedStyle(node);
        if (overflowY !== "visible") {
            bottom = Math.min(bottom, node.getBoundingClientRect().bottom);
        }
        node = node.parentElement;
    }

    return bottom;
}

function isEditorFocused(editorElement: HTMLElement): boolean {
    const active = document.activeElement;
    if (active && editorElement.contains(active)) return true;
    // Contenteditable focus can land on a descendant; :focus-within covers
    // browsers where activeElement differs.
    return editorElement.matches(":focus-within");
}

/**
 * Keeps the status row in view as the post grows past the fold.
 *
 * Signals: an IntersectionObserver on the row plus caret/input/resize events,
 * both funnelled through one evaluation.
 *
 * Scrolling walks the whole ancestor chain and pins every scrollable element
 * to its maximum, so the page reaches the true bottom rather than stopping at
 * the row's bottom edge.
 *
 * Upward scrolling is treated as an explicit "let me read" gesture: it
 * suspends following until the scroll reaches the end again, so the page
 * never fights the writer while they scroll up with the caret still inside
 * the editor.
 */
export function useBottomRowFollow(options: {
    getEditorElement: () => HTMLElement | null;
    getStatusBarElement: () => HTMLElement | null;
    /** False until the editor has mounted its DOM. */
    enabled: boolean;
}) {
    const { getEditorElement, getStatusBarElement, enabled } = options;

    useEffect(() => {
        if (!enabled) return;

        const statusBar = getStatusBarElement();
        const editorElement = getEditorElement();
        if (!statusBar || !editorElement) return;

        let userScrolledUp = false;

        const scrollToEnd = () => {
            let node = editorElement.parentElement;
            while (node) {
                const { overflowY } = window.getComputedStyle(node);
                const scrollable = /(auto|scroll|overlay)/.test(overflowY);
                if (scrollable && node.scrollHeight > node.clientHeight + 1) {
                    node.scrollTop = node.scrollHeight;
                }
                node = node.parentElement;
            }

            // The document scroller is not always in the element chain.
            const documentScroller =
                (document.scrollingElement as HTMLElement | null) ??
                document.documentElement;
            if (
                documentScroller.scrollHeight >
                documentScroller.clientHeight
            ) {
                window.scrollTo(0, documentScroller.scrollHeight);
            }
        };

        const evaluate = () => {
            // Reaching the end clears a previous scroll-up suspension even if
            // no scroll event carried us here (caret moves, typing, resize).
            if (userScrolledUp && isChainAtBottom(editorElement)) {
                userScrolledUp = false;
            }

            const follow = shouldFollowByRect({
                statusBarBottom: statusBar.getBoundingClientRect().bottom,
                visibleBottom: getVisibleBottom(editorElement),
                isEditorFocused: isEditorFocused(editorElement),
                userScrolledUp,
            });

            if (follow) scrollToEnd();
        };

        let frame = 0;
        const schedule = () => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                evaluate();
            });
        };

        // Track scroll positions per target to tell upward scrolls apart from
        // content growth (which moves the row down without a scroll event).
        const lastTops = new Map<EventTarget, number>();

        const onScroll = (event: Event) => {
            const target = event.target;

            let top: number;
            if (target === document || target === document.documentElement) {
                top = window.scrollY;
            } else if (target instanceof HTMLElement) {
                top = target.scrollTop;
            } else {
                return;
            }

            const previous = lastTops.get(target) ?? top;
            lastTops.set(target, top);

            if (isScrollUp(previous, top)) {
                userScrolledUp = true;
                return;
            }

            // Reaching the very bottom lifts the suspension, regardless of
            // where the row's bottom happens to land with the current padding.
            if (userScrolledUp && isChainAtBottom(editorElement)) {
                userScrolledUp = false;
            }
        };

        document.addEventListener("scroll", onScroll, {
            capture: true,
            passive: true,
        });

        let observer: IntersectionObserver | null = null;
        if (typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver(
                (entries) => {
                    if (entries.some((entry) => entry.intersectionRatio < 1)) {
                        schedule();
                    }
                },
                {
                    // Root omitted: intersect with the viewport. A nested root
                    // proved unreliable in this layout.
                    threshold: Array.from(
                        { length: 21 },
                        (_, index) => index / 20,
                    ),
                },
            );
            observer.observe(statusBar);
        }

        // Caret moves, typing, and layout growth all re-check the row.
        const onCaretOrInput = () => schedule();
        document.addEventListener("selectionchange", onCaretOrInput);
        document.addEventListener("input", onCaretOrInput, true);
        window.addEventListener("resize", onCaretOrInput);

        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(() => schedule());
            resizeObserver.observe(editorElement);
        }

        return () => {
            observer?.disconnect();
            resizeObserver?.disconnect();
            document.removeEventListener("scroll", onScroll, true);
            document.removeEventListener("selectionchange", onCaretOrInput);
            document.removeEventListener("input", onCaretOrInput, true);
            window.removeEventListener("resize", onCaretOrInput);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [getEditorElement, getStatusBarElement, enabled]);
}
