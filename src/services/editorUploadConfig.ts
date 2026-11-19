import { ConfigType } from "@prisma/client";
import { z } from "zod";
import prisma from "@/utils/prisma";
import { normalizeStorageFolder, DEFAULT_UPLOAD_BASE_PATH } from "@/utils/storagePath";
import { MAX_MEDIA_UPLOAD_BYTES } from "@/constants";
import type { PostProcessingOperation } from "@/services/AssetService";

/**
 * Config keys backing editor paste/drop upload behaviour.
 *
 * Resolution order per key: DB row -> env-overridable default. There is no
 * auto-creation of rows, so `EDITOR_UPLOAD_DEFAULTS` keeps taking effect until
 * an admin explicitly saves an override in the settings UI.
 */
export const EDITOR_UPLOAD_CONFIG_KEYS = {
    enabled: "editor.upload.enabled",
    folder: "editor.upload.folder",
    tags: "editor.upload.tags",
    maxBytes: "editor.upload.maxBytes",
    allowedMimeTypes: "editor.upload.allowedMimeTypes",
    postProcessings: "editor.upload.postProcessings",
} as const;

export type EditorUploadConfigKey = keyof typeof EDITOR_UPLOAD_CONFIG_KEYS;

export interface EditorUploadConfig {
    /** Whether paste/drop uploads are accepted at all. */
    enabled: boolean;
    /** Storage folder prefix, relative to the upload base path. */
    folder: string;
    /** Tags applied to assets uploaded from the editor. */
    tags: string[];
    /** Maximum accepted file size in bytes. */
    maxBytes: number;
    /** Accepted MIME types. */
    allowedMimeTypes: string[];
    /** Post-processing operations applied after upload. */
    postProcessings: PostProcessingOperation[];
}

export type EditorUploadConfigSource = "db" | "default";

export interface ResolvedEditorUploadConfig {
    config: EditorUploadConfig;
    sources: Record<EditorUploadConfigKey, EditorUploadConfigSource>;
    defaults: EditorUploadConfig;
    /** Storage key root, shown in the settings UI's path preview. */
    uploadBasePath: string;
}

/** Hard cap mirrored from the media route's initiate schema. */
export const MAX_UPLOAD_BYTES = MAX_MEDIA_UPLOAD_BYTES;

export const CODE_DEFAULT_EDITOR_UPLOAD_CONFIG: EditorUploadConfig = {
    enabled: true,
    folder: "images/post-inline",
    tags: ["post-inline"],
    maxBytes: 10 * 1024 * 1024,
    allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/avif",
        "image/svg+xml",
    ],
    postProcessings: [],
};

const MIME_PATTERN = /^[\w.+-]+\/[\w.+-]+$/;

const PostProcessingOperationSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("resize"),
        config: z.object({
            width: z.number().int().positive().optional(),
            height: z.number().int().positive().optional(),
            fit: z
                .enum(["cover", "contain", "fill", "inside", "outside"])
                .optional(),
        }),
    }),
    z.object({
        type: z.literal("compress"),
        config: z.object({
            quality: z.number().min(1).max(100).optional(),
        }),
    }),
    z.object({
        type: z.literal("convertFormat"),
        config: z.object({
            format: z.enum(["jpeg", "png", "webp", "avif"]),
            quality: z.number().min(1).max(100).optional(),
        }),
    }),
]);

const FolderSchema = z
    .string()
    .transform(normalizeStorageFolder)
    .refine((folder) => !folder.split("/").includes(".."), {
        message: "Folder must not contain '..' segments",
    });

const TagsSchema = z.array(z.string().trim().min(1)).max(32);
const MimeTypesSchema = z.array(z.string().regex(MIME_PATTERN)).min(1);
const MaxBytesSchema = z.number().int().positive().max(MAX_UPLOAD_BYTES);
const PostProcessingsSchema = z.array(PostProcessingOperationSchema);

const ConfigFieldsSchema = z.object({
    enabled: z.boolean().optional(),
    folder: FolderSchema.optional(),
    tags: TagsSchema.optional(),
    maxBytes: MaxBytesSchema.optional(),
    allowedMimeTypes: MimeTypesSchema.optional(),
    postProcessings: PostProcessingsSchema.optional(),
});

const EnvDefaultsSchema = ConfigFieldsSchema;

/**
 * Update payload. A `null` value clears that override so the default
 * (env-overridable) applies again; `undefined`/absent leaves it untouched.
 */
const UpdateEditorUploadSchema = z.object({
    enabled: z.boolean().nullable().optional(),
    folder: FolderSchema.nullable().optional(),
    tags: TagsSchema.nullable().optional(),
    maxBytes: MaxBytesSchema.nullable().optional(),
    allowedMimeTypes: MimeTypesSchema.nullable().optional(),
    postProcessings: PostProcessingsSchema.nullable().optional(),
});

export type UpdateEditorUploadConfigInput = z.infer<
    typeof UpdateEditorUploadSchema
>;

/**
 * Code defaults with `EDITOR_UPLOAD_DEFAULTS` (JSON) merged over them.
 * Invalid env values are ignored with a warning rather than crashing the app.
 */
export function getDefaultEditorUploadConfig(): EditorUploadConfig {
    const raw = process.env.EDITOR_UPLOAD_DEFAULTS;
    if (!raw) return CODE_DEFAULT_EDITOR_UPLOAD_CONFIG;

    try {
        const parsed = EnvDefaultsSchema.parse(JSON.parse(raw));
        return { ...CODE_DEFAULT_EDITOR_UPLOAD_CONFIG, ...parsed };
    } catch (error) {
        console.warn(
            "[editorUploadConfig] Ignoring invalid EDITOR_UPLOAD_DEFAULTS:",
            error,
        );
        return CODE_DEFAULT_EDITOR_UPLOAD_CONFIG;
    }
}

const DESCRIPTIONS: Record<EditorUploadConfigKey, string> = {
    enabled:
        "Whether the v2 editor accepts image paste/drop uploads. When disabled, drops are ignored.",
    folder:
        "Storage folder for editor-uploaded images, relative to the upload base path. Leave empty to use the dated default path.",
    tags: "JSON array of tags applied to assets uploaded from the editor.",
    maxBytes:
        "Maximum size in bytes for an editor paste/drop upload. Larger files must go through the Media Library.",
    allowedMimeTypes:
        'JSON array of accepted MIME types for editor uploads, e.g. ["image/png"].',
    postProcessings:
        "JSON array of post-processing operations (resize, compress, convertFormat) applied to editor uploads.",
};

function serializeValue(
    key: EditorUploadConfigKey,
    value: EditorUploadConfig[EditorUploadConfigKey],
): string {
    switch (key) {
        case "enabled":
            return value ? "true" : "false";
        case "maxBytes":
            return String(value);
        case "folder":
            return String(value);
        default:
            return JSON.stringify(value);
    }
}

function configValueType(key: EditorUploadConfigKey): ConfigType {
    switch (key) {
        case "enabled":
            return ConfigType.boolean;
        case "maxBytes":
            return ConfigType.number;
        case "folder":
            return ConfigType.string;
        default:
            return ConfigType.json;
    }
}

function warnInvalid(key: string, error: unknown) {
    console.warn(
        `[editorUploadConfig] Invalid stored value for '${key}', using default.`,
        error,
    );
}

/**
 * Resolve the effective editor upload config. Each key independently falls
 * back to its env-overridable default when missing or invalid in the DB.
 */
export async function resolveEditorUploadConfig(): Promise<ResolvedEditorUploadConfig> {
    const defaults = getDefaultEditorUploadConfig();
    const rows = await prisma.config.findMany({
        where: { key: { in: Object.values(EDITOR_UPLOAD_CONFIG_KEYS) } },
    });
    const stored: Record<string, string> = Object.fromEntries(
        rows.map((row) => [row.key, row.value]),
    );

    const config: EditorUploadConfig = { ...defaults };
    const sources: Record<EditorUploadConfigKey, EditorUploadConfigSource> = {
        enabled: "default",
        folder: "default",
        tags: "default",
        maxBytes: "default",
        allowedMimeTypes: "default",
        postProcessings: "default",
    };

    const enabledRaw = stored[EDITOR_UPLOAD_CONFIG_KEYS.enabled];
    if (enabledRaw !== undefined) {
        if (enabledRaw === "true" || enabledRaw === "false") {
            config.enabled = enabledRaw === "true";
            sources.enabled = "db";
        } else {
            warnInvalid(EDITOR_UPLOAD_CONFIG_KEYS.enabled, enabledRaw);
        }
    }

    const folderRaw = stored[EDITOR_UPLOAD_CONFIG_KEYS.folder];
    if (folderRaw !== undefined) {
        const parsed = FolderSchema.safeParse(folderRaw);
        if (parsed.success) {
            config.folder = parsed.data;
            sources.folder = "db";
        } else {
            warnInvalid(EDITOR_UPLOAD_CONFIG_KEYS.folder, parsed.error);
        }
    }

    const maxBytesRaw = stored[EDITOR_UPLOAD_CONFIG_KEYS.maxBytes];
    if (maxBytesRaw !== undefined) {
        const parsed = MaxBytesSchema.safeParse(Number(maxBytesRaw));
        if (parsed.success) {
            config.maxBytes = parsed.data;
            sources.maxBytes = "db";
        } else {
            warnInvalid(EDITOR_UPLOAD_CONFIG_KEYS.maxBytes, maxBytesRaw);
        }
    }

    const readJson = <T>(
        key: EditorUploadConfigKey,
        schema: z.ZodType<T>,
    ): T | undefined => {
        const raw = stored[EDITOR_UPLOAD_CONFIG_KEYS[key]];
        if (raw === undefined) return undefined;
        let value: unknown;
        try {
            value = JSON.parse(raw);
        } catch (error) {
            warnInvalid(EDITOR_UPLOAD_CONFIG_KEYS[key], error);
            return undefined;
        }
        const parsed = schema.safeParse(value);
        if (!parsed.success) {
            warnInvalid(EDITOR_UPLOAD_CONFIG_KEYS[key], parsed.error);
            return undefined;
        }
        return parsed.data;
    };

    const tags = readJson("tags", TagsSchema);
    if (tags) {
        config.tags = tags;
        sources.tags = "db";
    }

    const allowedMimeTypes = readJson("allowedMimeTypes", MimeTypesSchema);
    if (allowedMimeTypes) {
        config.allowedMimeTypes = allowedMimeTypes;
        sources.allowedMimeTypes = "db";
    }

    const postProcessings = readJson(
        "postProcessings",
        PostProcessingsSchema,
    ) as PostProcessingOperation[] | undefined;
    if (postProcessings) {
        config.postProcessings = postProcessings;
        sources.postProcessings = "db";
    }

    return { config, sources, defaults, uploadBasePath: DEFAULT_UPLOAD_BASE_PATH };
}

/**
 * Upsert the provided keys; `null` clears an override. Omitted keys keep
 * their current DB value or default. Returns the re-resolved config.
 */
export async function updateEditorUploadConfig(
    input: UpdateEditorUploadConfigInput,
): Promise<ResolvedEditorUploadConfig> {
    const parsed = UpdateEditorUploadSchema.parse(input);
    const entries = Object.entries(parsed) as Array<
        [
            EditorUploadConfigKey,
            EditorUploadConfig[EditorUploadConfigKey] | null,
        ]
    >;

    const clearedKeys: string[] = [];
    const upserts = [];

    for (const [field, value] of entries) {
        const key = EDITOR_UPLOAD_CONFIG_KEYS[field];
        if (value === null) {
            clearedKeys.push(key);
            continue;
        }
        upserts.push(
            prisma.config.upsert({
                where: { key },
                update: {
                    value: serializeValue(field, value),
                    type: configValueType(field),
                    description: DESCRIPTIONS[field],
                },
                create: {
                    key,
                    value: serializeValue(field, value),
                    type: configValueType(field),
                    description: DESCRIPTIONS[field],
                },
            }),
        );
    }

    if (clearedKeys.length > 0 || upserts.length > 0) {
        await prisma.$transaction([
            ...(clearedKeys.length > 0
                ? [
                      prisma.config.deleteMany({
                          where: { key: { in: clearedKeys } },
                      }),
                  ]
                : []),
            ...upserts,
        ]);
    }

    return resolveEditorUploadConfig();
}

/**
 * Delete stored overrides so the env-overridable defaults apply again.
 * Without `fields`, every editor upload key is cleared.
 */
export async function resetEditorUploadConfig(
    fields?: EditorUploadConfigKey[],
): Promise<ResolvedEditorUploadConfig> {
    const keys = fields
        ? fields.map((field) => EDITOR_UPLOAD_CONFIG_KEYS[field])
        : Object.values(EDITOR_UPLOAD_CONFIG_KEYS);

    await prisma.config.deleteMany({ where: { key: { in: keys } } });

    return resolveEditorUploadConfig();
}
