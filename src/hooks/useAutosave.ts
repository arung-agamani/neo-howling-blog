import { useCallback, useEffect, useRef, useState } from "react";
import axios from "@/utils/axios";

/**
 * Configuration key for autosave interval in milliseconds
 */
export const AUTOSAVE_INTERVAL_CONFIG_KEY = "editor.autosave.interval.ms";

/**
 * Default autosave interval in milliseconds (30 seconds)
 */
export const DEFAULT_AUTOSAVE_INTERVAL = 30000;

interface AutosaveConfig {
    interval: number;
    isLoading: boolean;
    error: string | null;
}

interface UseAutosaveOptions {
    /** Function to call when autosaving */
    onSave: () => Promise<void>;
    /** Whether there are unsaved changes */
    hasUnsavedChanges: boolean;
    /** Whether the editor is currently saving (to prevent concurrent saves) */
    isSaving: boolean;
    /** Whether autosave is enabled */
    enabled?: boolean;
    /** Dependencies that should reset the autosave timer when changed */
    dependencies?: unknown[];
}

interface UseAutosaveReturn {
    /** Current autosave configuration */
    config: AutosaveConfig;
    /** Last autosave timestamp */
    lastAutosave: Date | null;
    /** Whether autosave is currently scheduled */
    isScheduled: boolean;
    /** Manually trigger autosave */
    triggerAutosave: () => void;
    /** Reset the autosave timer */
    resetTimer: () => void;
}

/**
 * Fetches the autosave interval from config API
 * If the config doesn't exist, it will be auto-created with the default value
 */
async function fetchAutosaveConfig(): Promise<number> {
    try {
        const response = await axios.get(
            `/api/v1/config/autosave`,
            { withCredentials: true }
        );

        if (response.data.success && response.data.data?.value) {
            const interval = parseInt(response.data.data.value, 10);
            if (!isNaN(interval) && interval > 0) {
                return interval;
            }
        }

        return DEFAULT_AUTOSAVE_INTERVAL;
    } catch (error) {
        console.warn("Failed to fetch autosave config, using default:", error);
        return DEFAULT_AUTOSAVE_INTERVAL;
    }
}

/**
 * Custom hook for handling autosave functionality in the post editor
 *
 * Features:
 * - Debounced autosave after a configurable period of inactivity
 * - Fetches interval from server config (auto-creates if not set)
 * - Prevents concurrent saves
 * - Tracks last autosave timestamp
 *
 * @example
 * ```tsx
 * const { config, lastAutosave, isScheduled } = useAutosave({
 *   onSave: async () => { await savePost(); },
 *   hasUnsavedChanges,
 *   isSaving,
 *   dependencies: [content, title, description],
 * });
 * ```
 */
export function useAutosave({
    onSave,
    hasUnsavedChanges,
    isSaving,
    enabled = true,
    dependencies = [],
}: UseAutosaveOptions): UseAutosaveReturn {
    const [config, setConfig] = useState<AutosaveConfig>({
        interval: DEFAULT_AUTOSAVE_INTERVAL,
        isLoading: true,
        error: null,
    });
    const [lastAutosave, setLastAutosave] = useState<Date | null>(null);
    const [isScheduled, setIsScheduled] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isSavingRef = useRef(isSaving);
    const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

    // Keep refs in sync
    useEffect(() => {
        isSavingRef.current = isSaving;
    }, [isSaving]);

    useEffect(() => {
        hasUnsavedChangesRef.current = hasUnsavedChanges;
    }, [hasUnsavedChanges]);

    // Fetch autosave config on mount
    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const interval = await fetchAutosaveConfig();
                if (mounted) {
                    setConfig({
                        interval,
                        isLoading: false,
                        error: null,
                    });
                }
            } catch (error) {
                if (mounted) {
                    setConfig({
                        interval: DEFAULT_AUTOSAVE_INTERVAL,
                        isLoading: false,
                        error: "Failed to load autosave config",
                    });
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    // Clear timer function
    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
            setIsScheduled(false);
        }
    }, []);

    // Autosave function
    const performAutosave = useCallback(async () => {
        // Check conditions before saving
        if (isSavingRef.current || !hasUnsavedChangesRef.current) {
            return;
        }

        try {
            await onSave();
            setLastAutosave(new Date());
        } catch (error) {
            console.error("Autosave failed:", error);
        }
    }, [onSave]);

    // Schedule autosave
    const scheduleAutosave = useCallback(() => {
        if (!enabled || config.isLoading) {
            return;
        }

        clearTimer();

        if (hasUnsavedChanges && !isSaving) {
            timerRef.current = setTimeout(() => {
                performAutosave();
                setIsScheduled(false);
            }, config.interval);
            setIsScheduled(true);
        }
    }, [enabled, config.isLoading, config.interval, hasUnsavedChanges, isSaving, clearTimer, performAutosave]);

    // Reset timer when dependencies change (content edited)
    useEffect(() => {
        if (hasUnsavedChanges && enabled && !config.isLoading) {
            scheduleAutosave();
        }

        return () => {
            clearTimer();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasUnsavedChanges, enabled, config.isLoading, config.interval, ...dependencies]);

    // Clear timer when saving starts (to prevent race conditions)
    useEffect(() => {
        if (isSaving) {
            clearTimer();
        }
    }, [isSaving, clearTimer]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimer();
        };
    }, [clearTimer]);

    // Manual trigger function
    const triggerAutosave = useCallback(() => {
        clearTimer();
        performAutosave();
    }, [clearTimer, performAutosave]);

    // Reset timer function (exposed for external use)
    const resetTimer = useCallback(() => {
        scheduleAutosave();
    }, [scheduleAutosave]);

    return {
        config,
        lastAutosave,
        isScheduled,
        triggerAutosave,
        resetTimer,
    };
}

export default useAutosave;
