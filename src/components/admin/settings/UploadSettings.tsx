"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    CheckCircle2,
    Plus,
    Trash2,
    Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
    useEditorUploadConfig,
    useResetEditorUploadConfig,
    useUpdateEditorUploadConfig,
} from "@/hooks/api/useEditorUploadConfig";
import type {
    EditorUploadConfig,
    UpdateEditorUploadConfigInput,
} from "@/hooks/api/useEditorUploadConfig";
import type {
    PostProcessingOperation,
    PostProcessingType,
} from "@/services/AssetService";
import { normalizeStorageFolder } from "@/utils/storagePath";
import { MAX_MEDIA_UPLOAD_BYTES } from "@/constants";

const BYTES_PER_MIB = 1024 * 1024;

/** Presets cover the realistic range; the number input handles the rest. */
const SIZE_PRESETS_MIB = [5, 10, 25];

const COMMON_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/avif",
    "image/svg+xml",
];

const MIME_PATTERN = /^[\w.+-]+\/[\w.+-]+$/;

const OPERATION_LABEL: Record<PostProcessingType, string> = {
    resize: "Resize",
    compress: "Compress",
    convertFormat: "Convert format",
};

const FIT_LABEL: Record<string, string> = {
    cover: "Fill frame",
    contain: "Fit inside",
    fill: "Stretch",
    inside: "Shrink only",
    outside: "Grow only",
};

const selectClass =
    "h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

const SAMPLE_FILENAME = "1735689600000-example.webp";

const FIELD_NAMES = [
    "enabled",
    "folder",
    "tags",
    "maxBytes",
    "allowedMimeTypes",
    "postProcessings",
] as const satisfies ReadonlyArray<keyof EditorUploadConfig>;

type FieldName = (typeof FIELD_NAMES)[number];

function valuesEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

function validateDraft(draft: EditorUploadConfig) {
    const errors: Partial<Record<FieldName, string>> = {};

    if (draft.folder.split("/").includes("..")) {
        errors.folder = "Folder must not contain '..' segments.";
    }
    if (!Number.isFinite(draft.maxBytes) || draft.maxBytes < 1) {
        errors.maxBytes = "Enter a size greater than zero.";
    } else if (draft.maxBytes > MAX_MEDIA_UPLOAD_BYTES) {
        errors.maxBytes = `Cannot exceed ${MAX_MEDIA_UPLOAD_BYTES / BYTES_PER_MIB} MiB.`;
    }
    if (draft.allowedMimeTypes.length === 0) {
        errors.allowedMimeTypes = "Add at least one accepted type.";
    } else if (
        draft.allowedMimeTypes.some((mime) => !MIME_PATTERN.test(mime))
    ) {
        errors.allowedMimeTypes =
            "Each type must look like image/png (type/subtype).";
    }
    if (
        draft.postProcessings.some(
            (operation) =>
                operation.type === "resize" &&
                !operation.config.width &&
                !operation.config.height,
        )
    ) {
        errors.postProcessings = "Each resize needs a width or a height.";
    }

    return errors;
}

function createOperation(type: PostProcessingType): PostProcessingOperation {
    switch (type) {
        case "resize":
            return { type: "resize", config: {} };
        case "compress":
            return { type: "compress", config: {} };
        case "convertFormat":
            return { type: "convertFormat", config: { format: "jpeg" } };
    }
}

function SectionHeading({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="mb-4 space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
            </h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

function Field({
    label,
    htmlFor,
    hint,
    error,
    showReset,
    resetHint,
    onReset,
    children,
}: {
    label: string;
    htmlFor?: string;
    hint?: string;
    error?: string;
    showReset?: boolean;
    resetHint?: string;
    onReset?: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Label htmlFor={htmlFor}>{label}</Label>
                {showReset && (
                    <button
                        type="button"
                        onClick={onReset}
                        title={resetHint}
                        className="ml-auto inline-flex items-center gap-1 rounded px-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                        <Undo2 className="h-3 w-3" />
                        Reset
                    </button>
                )}
            </div>
            {children}
            {error ? (
                <p className="text-xs text-destructive">{error}</p>
            ) : hint ? (
                <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
        </div>
    );
}

function PathPreview({
    basePath,
    folder,
}: {
    basePath: string;
    folder: string;
}) {
    const normalized = normalizeStorageFolder(folder);
    return (
        <div className="mt-2 rounded-md bg-muted px-3 py-2 font-mono text-xs break-all">
            <span className="text-muted-foreground">{basePath}/</span>
            <span
                className={
                    normalized
                        ? "font-medium text-foreground"
                        : "italic text-muted-foreground"
                }
            >
                {normalized || "&lt;year&gt;/&lt;month&gt;"}
            </span>
            <span className="text-muted-foreground">/{SAMPLE_FILENAME}</span>
        </div>
    );
}

function OperationFields({
    operation,
    onChange,
}: {
    operation: PostProcessingOperation;
    onChange: (next: PostProcessingOperation) => void;
}) {
    if (operation.type === "resize") {
        return (
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                            Width (px)
                        </Label>
                        <Input
                            type="number"
                            min={1}
                            placeholder="auto"
                            value={operation.config.width ?? ""}
                            onChange={(event) =>
                                onChange({
                                    ...operation,
                                    config: {
                                        ...operation.config,
                                        width: event.target.value
                                            ? Number(event.target.value)
                                            : undefined,
                                    },
                                })
                            }
                            className="h-9"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">
                            Height (px)
                        </Label>
                        <Input
                            type="number"
                            min={1}
                            placeholder="auto"
                            value={operation.config.height ?? ""}
                            onChange={(event) =>
                                onChange({
                                    ...operation,
                                    config: {
                                        ...operation.config,
                                        height: event.target.value
                                            ? Number(event.target.value)
                                            : undefined,
                                    },
                                })
                            }
                            className="h-9"
                        />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    Leave one dimension empty to preserve the aspect ratio.
                </p>
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                        Fit
                    </Label>
                    <select
                        className={selectClass}
                        value={operation.config.fit ?? ""}
                        onChange={(event) =>
                            onChange({
                                ...operation,
                                config: {
                                    ...operation.config,
                                    fit: (event.target.value || undefined) as
                                        | "cover"
                                        | "contain"
                                        | "fill"
                                        | "inside"
                                        | "outside"
                                        | undefined,
                                },
                            })
                        }
                    >
                        <option value="">Default</option>
                        {Object.entries(FIT_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );
    }

    if (operation.type === "compress") {
        return (
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                    Quality
                </Label>
                <QualityInput
                    value={operation.config.quality}
                    onChange={(quality) =>
                        onChange({
                            ...operation,
                            config: { ...operation.config, quality },
                        })
                    }
                />
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Format</Label>
                <select
                    className={selectClass}
                    value={operation.config.format}
                    onChange={(event) =>
                        onChange({
                            ...operation,
                            config: {
                                ...operation.config,
                                format: event.target.value as
                                    | "jpeg"
                                    | "png"
                                    | "webp"
                                    | "avif",
                            },
                        })
                    }
                >
                    <option value="jpeg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                    <option value="avif">AVIF</option>
                </select>
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                    Quality
                </Label>
                <QualityInput
                    value={operation.config.quality}
                    onChange={(quality) =>
                        onChange({
                            ...operation,
                            config: { ...operation.config, quality },
                        })
                    }
                />
            </div>
        </div>
    );
}

function QualityInput({
    value,
    onChange,
}: {
    value?: number;
    onChange: (value: number | undefined) => void;
}) {
    return (
        <div className="relative w-32">
            <Input
                type="number"
                min={1}
                max={100}
                placeholder="default"
                value={value ?? ""}
                onChange={(event) =>
                    onChange(
                        event.target.value
                            ? Number(event.target.value)
                            : undefined,
                    )
                }
                className="h-9 pr-8"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                %
            </span>
        </div>
    );
}

export default function UploadSettings() {
    const { toast } = useToast();
    const { data, isLoading, isError } = useEditorUploadConfig();
    const updateMutation = useUpdateEditorUploadConfig();
    const resetMutation = useResetEditorUploadConfig();

    const [draft, setDraft] = useState<EditorUploadConfig | null>(null);
    // Fields the user asked to fall back to the default; sent as `null` on save.
    const [pendingResets, setPendingResets] = useState<
        Partial<Record<FieldName, true>>
    >({});
    const [tagInput, setTagInput] = useState("");
    const [mimeInput, setMimeInput] = useState("");
    const [newOperationType, setNewOperationType] =
        useState<PostProcessingType>("resize");
    const [confirmResetAll, setConfirmResetAll] = useState(false);
    const syncedConfigRef = useRef<EditorUploadConfig | null>(null);

    // Re-sync only when the resolved config actually changes, so a re-render
    // or a no-op refetch never clobbers a draft in progress.
    useEffect(() => {
        if (!data) return;
        if (
            syncedConfigRef.current &&
            valuesEqual(syncedConfigRef.current, data.config)
        ) {
            return;
        }
        syncedConfigRef.current = data.config;
        setDraft(data.config);
        setPendingResets({});
    }, [data]);

    const errors = useMemo(
        () => (draft ? validateDraft(draft) : {}),
        [draft],
    );

    const payload = useMemo<UpdateEditorUploadConfigInput>(() => {
        if (!draft || !data) return {};
        const changes: UpdateEditorUploadConfigInput = {};
        const setChange = <K extends FieldName>(
            field: K,
            value: EditorUploadConfig[K] | null,
        ) => {
            changes[field] = value;
        };
        for (const field of FIELD_NAMES) {
            if (pendingResets[field]) {
                setChange(field, null);
            } else if (!valuesEqual(draft[field], data.config[field])) {
                setChange(field, draft[field]);
            }
        }
        return changes;
    }, [draft, data, pendingResets]);

    if (isError) {
        return (
            <p className="text-sm text-destructive">
                Failed to load upload configuration. Reload the page to retry.
            </p>
        );
    }

    if (isLoading || !draft || !data) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
        );
    }

    const { sources, defaults, uploadBasePath } = data;
    const isDirty = Object.keys(payload).length > 0;
    const hasErrors = Object.keys(errors).length > 0;
    const isSaving = updateMutation.isPending || resetMutation.isPending;

    const setField = <K extends FieldName>(
        field: K,
        value: EditorUploadConfig[K],
    ) => {
        setDraft((current) =>
            current ? { ...current, [field]: value } : current,
        );
        setPendingResets((current) => {
            if (!current[field]) return current;
            const next = { ...current };
            delete next[field];
            return next;
        });
    };

    /** Revert a field to the env-overridable default on the next save. */
    const resetField = (field: FieldName) => {
        setDraft((current) =>
            current ? { ...current, [field]: defaults[field] } : current,
        );
        setPendingResets((current) => ({ ...current, [field]: true }));
    };

    const canResetField = (field: FieldName) =>
        sources[field] === "db" && !pendingResets[field];

    const handleDiscard = () => {
        setDraft(data.config);
        setPendingResets({});
        setTagInput("");
        setMimeInput("");
    };

    const handleSave = () => {
        updateMutation.mutate(payload, {
            onSuccess: (result) => {
                setDraft(result.config);
                setPendingResets({});
                toast({ title: "Upload settings saved" });
            },
            onError: (error) =>
                toast({
                    title: "Failed to save upload settings",
                    description: error.message,
                    variant: "destructive",
                }),
        });
    };

    const handleResetAll = () => {
        resetMutation.mutate(undefined, {
            onSuccess: () => {
                setConfirmResetAll(false);
                toast({
                    title: "Upload settings reset",
                    description: "Defaults apply to every field again.",
                });
            },
            onError: (error) =>
                toast({
                    title: "Failed to reset upload settings",
                    description: error.message,
                    variant: "destructive",
                }),
        });
    };

    const addTag = () => {
        const tag = tagInput.trim();
        if (!tag || draft.tags.includes(tag)) return;
        setField("tags", [...draft.tags, tag]);
        setTagInput("");
    };

    const addMimeType = (mime: string) => {
        const value = mime.trim();
        if (!value || draft.allowedMimeTypes.includes(value)) return;
        setField("allowedMimeTypes", [...draft.allowedMimeTypes, value]);
        setMimeInput("");
    };

    const removeMimeType = (mime: string) =>
        setField(
            "allowedMimeTypes",
            draft.allowedMimeTypes.filter((current) => current !== mime),
        );

    const setOperations = (postProcessings: PostProcessingOperation[]) =>
        setField("postProcessings", postProcessings);

    const moveOperation = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= draft.postProcessings.length) return;
        const next = [...draft.postProcessings];
        [next[index], next[target]] = [next[target], next[index]];
        setOperations(next);
    };

    const missingCommonTypes = COMMON_IMAGE_TYPES.filter(
        (type) => !draft.allowedMimeTypes.includes(type),
    );
    const sizeMib = Math.round(draft.maxBytes / BYTES_PER_MIB);

    return (
        <div className="space-y-8">
            {/* Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    {isDirty ? (
                        <>
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Unsaved changes
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            All changes saved
                        </>
                    )}
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDiscard}
                        disabled={!isDirty || isSaving}
                    >
                        Discard
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={!isDirty || hasErrors || isSaving}
                    >
                        Save changes
                    </Button>
                </div>
            </div>

            {/* Status */}
            <section>
                <SectionHeading
                    title="Status"
                    description="Controls whether images can be pasted or dropped into the v2 editor. Media Library uploads are unaffected."
                />
                <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            Accept editor image uploads
                        </p>
                        <p className="text-xs text-muted-foreground">
                            When off, the server rejects editor uploads even if
                            the editor still accepts a drop.
                        </p>
                    </div>
                    <Switch
                        checked={draft.enabled}
                        onCheckedChange={(checked) =>
                            setField("enabled", checked)
                        }
                        aria-label="Accept editor image uploads"
                    />
                </div>
                {!draft.enabled && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Uploads are disabled. The settings below are kept for
                        when you re-enable them.
                    </p>
                )}
            </section>

            <Separator />

            {/* Destination */}
            <section>
                <SectionHeading
                    title="Destination"
                    description="Where editor uploads are stored and how they are tagged in the Media Library."
                />
                <div className="space-y-5">
                    <Field
                        label="Storage folder"
                        htmlFor="upload-folder"
                        showReset={canResetField("folder")}
                        resetHint={`Reset to default (${defaults.folder || "dated path"})`}
                        onReset={() => resetField("folder")}
                        hint="Relative to the storage root. Slashes at either end are trimmed automatically."
                    >
                        <div className="flex items-center rounded-md border border-input focus-within:ring-1 focus-within:ring-ring">
                            <span className="select-none border-r px-3 py-2 text-sm text-muted-foreground">
                                {uploadBasePath}/
                            </span>
                            <Input
                                id="upload-folder"
                                value={draft.folder}
                                onChange={(event) =>
                                    setField("folder", event.target.value)
                                }
                                placeholder="images/post-inline"
                                className="rounded-none border-0 shadow-none focus-visible:ring-0"
                            />
                        </div>
                        <PathPreview
                            basePath={uploadBasePath}
                            folder={draft.folder}
                        />
                    </Field>

                    <Field
                        label="Tags"
                        showReset={canResetField("tags")}
                        resetHint={`Reset to default (${defaults.tags.join(", ") || "none"})`}
                        onReset={() => resetField("tags")}
                        hint="Applied to every editor upload and usable as a filter in the Media Library."
                    >
                        <div className="flex flex-wrap gap-2">
                            {draft.tags.length === 0 && (
                                <span className="text-xs text-muted-foreground">
                                    No tags
                                </span>
                            )}
                            {draft.tags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="gap-1"
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        aria-label={`Remove tag ${tag}`}
                                        onClick={() =>
                                            setField(
                                                "tags",
                                                draft.tags.filter(
                                                    (current) =>
                                                        current !== tag,
                                                ),
                                            )
                                        }
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={tagInput}
                                onChange={(event) =>
                                    setTagInput(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        addTag();
                                    }
                                }}
                                placeholder="Add a tag"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addTag}
                                disabled={!tagInput.trim()}
                            >
                                Add
                            </Button>
                        </div>
                    </Field>
                </div>
            </section>

            <Separator />

            {/* Acceptance */}
            <section>
                <SectionHeading
                    title="Accepted files"
                    description="Enforced server-side, so these limits hold regardless of what a client sends."
                />
                <div className="space-y-5">
                    <Field
                        label="Maximum size"
                        htmlFor="upload-max-size"
                        showReset={canResetField("maxBytes")}
                        resetHint={`Reset to default (${Math.round(
                            defaults.maxBytes / BYTES_PER_MIB,
                        )} MiB)`}
                        onReset={() => resetField("maxBytes")}
                        error={errors.maxBytes}
                        hint="Larger files must be uploaded through the Media Library."
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative w-40">
                                <Input
                                    id="upload-max-size"
                                    type="number"
                                    min={1}
                                    max={MAX_MEDIA_UPLOAD_BYTES / BYTES_PER_MIB}
                                    value={Number.isFinite(sizeMib) ? sizeMib : ""}
                                    onChange={(event) =>
                                        setField(
                                            "maxBytes",
                                            Math.round(
                                                Number(event.target.value || 0) *
                                                    BYTES_PER_MIB,
                                            ),
                                        )
                                    }
                                    className="pr-12"
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                                    MiB
                                </span>
                            </div>
                            <div className="flex gap-1">
                                {SIZE_PRESETS_MIB.map((preset) => (
                                    <Button
                                        key={preset}
                                        type="button"
                                        size="sm"
                                        variant={
                                            sizeMib === preset
                                                ? "secondary"
                                                : "ghost"
                                        }
                                        className="h-8 px-2 text-xs"
                                        onClick={() =>
                                            setField(
                                                "maxBytes",
                                                preset * BYTES_PER_MIB,
                                            )
                                        }
                                    >
                                        {preset} MiB
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </Field>

                    <Field
                        label="Allowed types"
                        showReset={canResetField("allowedMimeTypes")}
                        resetHint="Reset to default (common image types)"
                        onReset={() => resetField("allowedMimeTypes")}
                        error={errors.allowedMimeTypes}
                    >
                        <div className="flex flex-wrap gap-2">
                            {draft.allowedMimeTypes.length === 0 && (
                                <span className="text-xs text-destructive">
                                    At least one type is required
                                </span>
                            )}
                            {draft.allowedMimeTypes.map((mime) => (
                                <Badge
                                    key={mime}
                                    variant="secondary"
                                    className="gap-1 font-mono text-xs"
                                >
                                    {mime}
                                    <button
                                        type="button"
                                        aria-label={`Remove ${mime}`}
                                        onClick={() => removeMimeType(mime)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        {missingCommonTypes.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                                <span className="text-xs text-muted-foreground">
                                    Quick add:
                                </span>
                                {missingCommonTypes.map((mime) => (
                                    <button
                                        key={mime}
                                        type="button"
                                        onClick={() => addMimeType(mime)}
                                        className="rounded border px-1.5 py-0.5 font-mono text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                                    >
                                        {mime}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Input
                                value={mimeInput}
                                onChange={(event) =>
                                    setMimeInput(event.target.value)
                                }
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        addMimeType(mimeInput);
                                    }
                                }}
                                placeholder="image/avif"
                                className="font-mono"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => addMimeType(mimeInput)}
                                disabled={!mimeInput.trim()}
                            >
                                Add
                            </Button>
                        </div>
                    </Field>
                </div>
            </section>

            <Separator />

            {/* Processing */}
            <section>
                <SectionHeading
                    title="Image processing"
                    description="Optional. Operations run in order after the file is uploaded."
                />
                <div className="space-y-3">
                    {draft.postProcessings.length === 0 && (
                        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            Nothing configured — uploads are stored exactly as
                            sent.
                        </p>
                    )}

                    {draft.postProcessings.map((operation, index) => (
                        <div
                            key={`${operation.type}-${index}`}
                            className="rounded-lg border p-3"
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-5 text-xs tabular-nums text-muted-foreground">
                                    {index + 1}
                                </span>
                                <select
                                    className={selectClass}
                                    value={operation.type}
                                    aria-label={`Operation ${index + 1} type`}
                                    onChange={(event) => {
                                        const next = [
                                            ...draft.postProcessings,
                                        ];
                                        next[index] = createOperation(
                                            event.target
                                                .value as PostProcessingType,
                                        );
                                        setOperations(next);
                                    }}
                                >
                                    {(
                                        Object.keys(
                                            OPERATION_LABEL,
                                        ) as PostProcessingType[]
                                    ).map((type) => (
                                        <option key={type} value={type}>
                                            {OPERATION_LABEL[type]}
                                        </option>
                                    ))}
                                </select>
                                <div className="ml-auto flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        aria-label="Move operation up"
                                        disabled={index === 0}
                                        onClick={() => moveOperation(index, -1)}
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        aria-label="Move operation down"
                                        disabled={
                                            index ===
                                            draft.postProcessings.length - 1
                                        }
                                        onClick={() => moveOperation(index, 1)}
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        aria-label="Remove operation"
                                        onClick={() =>
                                            setOperations(
                                                draft.postProcessings.filter(
                                                    (_, current) =>
                                                        current !== index,
                                                ),
                                            )
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-3 pl-7">
                                <OperationFields
                                    operation={operation}
                                    onChange={(next) => {
                                        const operations = [
                                            ...draft.postProcessings,
                                        ];
                                        operations[index] = next;
                                        setOperations(operations);
                                    }}
                                />
                            </div>
                        </div>
                    ))}

                    {errors.postProcessings && (
                        <p className="text-xs text-destructive">
                            {errors.postProcessings}
                        </p>
                    )}

                    <div className="flex items-center gap-2">
                        <select
                            className={selectClass}
                            value={newOperationType}
                            aria-label="Operation to add"
                            onChange={(event) =>
                                setNewOperationType(
                                    event.target.value as PostProcessingType,
                                )
                            }
                        >
                            {(
                                Object.keys(OPERATION_LABEL) as PostProcessingType[]
                            ).map((type) => (
                                <option key={type} value={type}>
                                    {OPERATION_LABEL[type]}
                                </option>
                            ))}
                        </select>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setOperations([
                                    ...draft.postProcessings,
                                    createOperation(newOperationType),
                                ])
                            }
                        >
                            <Plus className="mr-1 h-4 w-4" />
                            Add operation
                        </Button>
                    </div>
                </div>
            </section>

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                    Fields without an override use the deployment defaults
                    (overridable through <code>EDITOR_UPLOAD_DEFAULTS</code>).
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmResetAll(true)}
                    disabled={isSaving}
                >
                    Reset all to defaults
                </Button>
            </div>

            <AlertDialog
                open={confirmResetAll}
                onOpenChange={setConfirmResetAll}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Reset all upload settings?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Stored overrides are deleted and the deployment
                            defaults apply again. Unsaved changes on this page
                            are discarded.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetAll}>
                            Reset everything
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
