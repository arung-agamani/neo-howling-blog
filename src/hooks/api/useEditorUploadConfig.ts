import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { del, get, put } from "@/lib/ky/client";
import type { PostProcessingOperation } from "@/services/AssetService";

export const EDITOR_UPLOAD_CONFIG_ENDPOINT = "config/editor-upload";

export interface EditorUploadConfig {
    enabled: boolean;
    folder: string;
    tags: string[];
    maxBytes: number;
    allowedMimeTypes: string[];
    postProcessings: PostProcessingOperation[];
}

export type EditorUploadConfigSource = "db" | "default";

export interface EditorUploadConfigResponse {
    success: boolean;
    data: {
        config: EditorUploadConfig;
        sources: Record<keyof EditorUploadConfig, EditorUploadConfigSource>;
        defaults: EditorUploadConfig;
        uploadBasePath: string;
    };
    message?: string;
}

export type UpdateEditorUploadConfigInput = {
    [K in keyof EditorUploadConfig]?: EditorUploadConfig[K] | null;
};

export const editorUploadConfigKeys = {
    all: ["editor-upload-config"] as const,
    detail: () => [...editorUploadConfigKeys.all, "detail"] as const,
};

/** Fetch the resolved editor upload configuration. */
export const useEditorUploadConfig = () =>
    useQuery({
        queryKey: editorUploadConfigKeys.detail(),
        queryFn: async () =>
            (await get<EditorUploadConfigResponse>(
                EDITOR_UPLOAD_CONFIG_ENDPOINT,
            )).data,
    });

/** Persist a partial override; omitted fields keep their current value. */
export const useUpdateEditorUploadConfig = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: UpdateEditorUploadConfigInput) =>
            (await put<EditorUploadConfigResponse>(
                EDITOR_UPLOAD_CONFIG_ENDPOINT,
                input,
            )).data,
        onSuccess: (data) => {
            queryClient.setQueryData(
                editorUploadConfigKeys.detail(),
                data,
            );
        },
    });
};

/** Clear stored overrides so defaults (env-overridable) apply again. */
export const useResetEditorUploadConfig = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (field?: keyof EditorUploadConfig) => {
            const url = field
                ? `${EDITOR_UPLOAD_CONFIG_ENDPOINT}?field=${field}`
                : EDITOR_UPLOAD_CONFIG_ENDPOINT;
            return (await del<EditorUploadConfigResponse>(url)).data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(
                editorUploadConfigKeys.detail(),
                data,
            );
        },
    });
};
