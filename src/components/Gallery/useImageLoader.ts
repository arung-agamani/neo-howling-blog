"use client";

import * as React from "react";

/**
 * Hook to track image load state with correct handling for cached images.
 *
 * Returns a `ref` callback (`imgRef`) that must be set on the `<img>` element,
 * plus `onLoad` / `onError` handlers and a `loaded` / `error` state.
 */
export function useImageLoader(src: string) {
    const [loaded, setLoaded] = React.useState(false);
    const [error, setError] = React.useState(false);
    const nodeRef = React.useRef<HTMLImageElement | null>(null);

    // Ref callback: when the `<img>` mounts — if the browser already has the
    // image cached the `load` event fires synchronously before React can attach
    // `onLoad`, so we check `complete` to catch that case immediately.
    const imgRef = React.useCallback((node: HTMLImageElement | null) => {
        nodeRef.current = node;
        if (node?.complete && node.naturalWidth > 0) {
            setLoaded(true);
        }
    }, []);

    // Reset when src changes (e.g. parent swaps the image).
    React.useEffect(() => {
        setLoaded(false);
        setError(false);
        if (nodeRef.current?.complete && nodeRef.current.naturalWidth > 0) {
            setLoaded(true);
        }
    }, [src]);

    const onLoad = React.useCallback(() => setLoaded(true), []);
    const onError = React.useCallback(() => setError(true), []);

    return { loaded, error, imgRef, onLoad, onError } as const;
}
