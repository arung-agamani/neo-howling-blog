"use client";

import { useState, useCallback, useEffect } from "react";
import axios from "@/utils/axios";
import type {
    PostProcessingOperation,
    PostProcessingPreset,
    PostProcessingPresetsConfig,
    ConfigApiResponse,
} from "./types";
import { POST_PROCESSING_PRESETS_CONFIG_KEY } from "./types";

interface UsePostProcessingPresetsReturn {
    /** Whether presets are available (API is accessible and loaded) */
    isAvailable: boolean;
    /** Whether presets are currently loading */
    isLoading: boolean;
    /** Error message if any */
    error: string | null;
    /** The complete presets configuration */
    presetsConfig: PostProcessingPresetsConfig | null;
    /** List of preset names */
    presetNames: string[];
    /** Name of the default preset, or null */
    defaultPresetName: string | null;
    /** Get operations for a specific preset */
    getPreset: (name: string) => PostProcessingPreset | null;
    /** Get operations for the default preset */
    getDefaultPresetOperations: () => PostProcessingOperation[];
    /** Save a new preset or update an existing one */
    savePreset: (
        name: string,
        operations: PostProcessingOperation[],
        description?: string,
    ) => Promise<boolean>;
    /** Delete a preset */
    deletePreset: (name: string) => Promise<boolean>;
    /** Set a preset as default */
    setDefaultPreset: (name: string | null) => Promise<boolean>;
    /** Reload presets from the server */
    reload: () => Promise<void>;
}

const DEFAULT_PRESETS_CONFIG: PostProcessingPresetsConfig = {
    default: null,
    presets: {},
};

/**
 * Hook for managing post-processing presets via the config API.
 * Provides graceful fallback if the API is not available.
 */
export function usePostProcessingPresets(): UsePostProcessingPresetsReturn {
    const [isAvailable, setIsAvailable] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [presetsConfig, setPresetsConfig] =
        useState<PostProcessingPresetsConfig | null>(null);

    /**
     * Fetch presets from the config API
     */
    const fetchPresets = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.get<ConfigApiResponse>(
                `/api/v1/config?key=${encodeURIComponent(POST_PROCESSING_PRESETS_CONFIG_KEY)}`,
                { withCredentials: true },
            );

            if (response.data.success && response.data.data) {
                try {
                    const parsed = JSON.parse(
                        response.data.data.value,
                    ) as PostProcessingPresetsConfig;
                    setPresetsConfig(parsed);
                    setIsAvailable(true);
                } catch {
                    // Invalid JSON in config, initialize with default
                    console.warn(
                        "Invalid presets config JSON, initializing with default",
                    );
                    setPresetsConfig(DEFAULT_PRESETS_CONFIG);
                    setIsAvailable(true);
                }
            }
        } catch (err: any) {
            // 404 means config doesn't exist yet, which is fine
            if (err.response?.status === 404) {
                setPresetsConfig(DEFAULT_PRESETS_CONFIG);
                setIsAvailable(true);
            } else if (err.response?.status === 401) {
                // Unauthorized - API is available but user can't access
                setIsAvailable(false);
                setError("Unauthorized to access presets");
            } else {
                // Other errors - API might not be available
                console.warn("Failed to fetch presets:", err.message);
                setIsAvailable(false);
                setError(err.message || "Failed to fetch presets");
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Save the presets config to the API
     */
    const savePresetsConfig = useCallback(
        async (config: PostProcessingPresetsConfig): Promise<boolean> => {
            try {
                await axios.put(
                    "/api/v1/config",
                    {
                        key: POST_PROCESSING_PRESETS_CONFIG_KEY,
                        value: JSON.stringify(config),
                        description: "Post-processing presets for media uploads",
                    },
                    { withCredentials: true },
                );

                setPresetsConfig(config);
                return true;
            } catch (err: any) {
                console.error("Failed to save presets config:", err);
                setError(err.message || "Failed to save presets");
                return false;
            }
        },
        [],
    );

    /**
     * Get a specific preset by name
     */
    const getPreset = useCallback(
        (name: string): PostProcessingPreset | null => {
            if (!presetsConfig) return null;
            return presetsConfig.presets[name] || null;
        },
        [presetsConfig],
    );

    /**
     * Get operations for the default preset
     */
    const getDefaultPresetOperations = useCallback((): PostProcessingOperation[] => {
        if (!presetsConfig || !presetsConfig.default) return [];
        const preset = presetsConfig.presets[presetsConfig.default];
        return preset?.operations || [];
    }, [presetsConfig]);

    /**
     * Save a new preset or update an existing one
     */
    const savePreset = useCallback(
        async (
            name: string,
            operations: PostProcessingOperation[],
            description?: string,
        ): Promise<boolean> => {
            if (!presetsConfig) return false;

            const existingPreset = presetsConfig.presets[name];
            const now = new Date().toISOString();

            const newConfig: PostProcessingPresetsConfig = {
                ...presetsConfig,
                presets: {
                    ...presetsConfig.presets,
                    [name]: {
                        operations,
                        description:
                            description ?? existingPreset?.description ?? "",
                        createdAt: existingPreset?.createdAt ?? now,
                        updatedAt: now,
                    },
                },
            };

            return savePresetsConfig(newConfig);
        },
        [presetsConfig, savePresetsConfig],
    );

    /**
     * Delete a preset by name
     */
    const deletePreset = useCallback(
        async (name: string): Promise<boolean> => {
            if (!presetsConfig) return false;

            const { [name]: _, ...remainingPresets } = presetsConfig.presets;

            const newConfig: PostProcessingPresetsConfig = {
                ...presetsConfig,
                presets: remainingPresets,
                // If we're deleting the default preset, unset the default
                default: presetsConfig.default === name ? null : presetsConfig.default,
            };

            return savePresetsConfig(newConfig);
        },
        [presetsConfig, savePresetsConfig],
    );

    /**
     * Set a preset as the default (or unset default with null)
     */
    const setDefaultPreset = useCallback(
        async (name: string | null): Promise<boolean> => {
            if (!presetsConfig) return false;

            // Validate that the preset exists (if setting, not unsetting)
            if (name !== null && !presetsConfig.presets[name]) {
                setError(`Preset '${name}' does not exist`);
                return false;
            }

            const newConfig: PostProcessingPresetsConfig = {
                ...presetsConfig,
                default: name,
            };

            return savePresetsConfig(newConfig);
        },
        [presetsConfig, savePresetsConfig],
    );

    /**
     * Reload presets from the server
     */
    const reload = useCallback(async () => {
        await fetchPresets();
    }, [fetchPresets]);

    // Computed values
    const presetNames = presetsConfig
        ? Object.keys(presetsConfig.presets).sort()
        : [];

    const defaultPresetName = presetsConfig?.default ?? null;

    // Fetch presets on mount
    useEffect(() => {
        fetchPresets();
    }, [fetchPresets]);

    return {
        isAvailable,
        isLoading,
        error,
        presetsConfig,
        presetNames,
        defaultPresetName,
        getPreset,
        getDefaultPresetOperations,
        savePreset,
        deletePreset,
        setDefaultPreset,
        reload,
    };
}

export default usePostProcessingPresets;
