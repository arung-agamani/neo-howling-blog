"use client";

import { useMemo, useState } from "react";
import {
    AlertCircle,
    Check,
    ChevronDown,
    ChevronRight,
    Copy,
    Edit,
    KeyRound,
    Plus,
    Search,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
    useConfigs,
    useCreateConfig,
    useDeleteConfig,
    useUpdateConfig,
    ConfigType,
} from "@/hooks/api/useConfig";
import type { Config } from "@/hooks/api/useConfig";
import {
    CONFIG_TYPES,
    ConfigTypeHint,
    ConfigTypePicker,
    ConfigValueEditor,
    normalizeConfigType,
    validateConfigValue,
} from "./ConfigValueEditor";

const KEY_PATTERN = /^[a-z0-9]+([._-][a-z0-9]+)*$/;
const MAX_KEY_LENGTH = 128;
const MAX_DESCRIPTION_LENGTH = 500;

const TYPE_FILTERS = ["all", ...CONFIG_TYPES] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

interface ConfigFormState {
    key: string;
    type: ConfigType;
    value: string;
    description: string;
}

const EMPTY_FORM: ConfigFormState = {
    key: "",
    type: "string",
    value: "",
    description: "",
};

/**
 * Group keys by their leading segment (`editor.upload.folder` → `editor`).
 * Coarse enough to stay useful at this config scale; the full path is still
 * shown in each row.
 */
function namespaceOf(key: string): string {
    return key.includes(".") ? key.split(".")[0] : "";
}

function leafOf(key: string, namespace: string): string {
    return namespace ? key.slice(namespace.length + 1) : key;
}

function valuePreview(config: Config): string {
    const type = normalizeConfigType(config.type);
    if (type === "boolean") return config.value === "true" ? "true" : "false";
    if (type === "json") {
        try {
            return JSON.stringify(JSON.parse(config.value));
        } catch {
            return "Invalid JSON";
        }
    }
    return config.value.replace(/\s+/g, " ").trim() || "—";
}

function TypeBadge({ type }: { type: ConfigType }) {
    return (
        <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {type}
        </Badge>
    );
}

export default function ConfigManagement() {
    const { toast } = useToast();
    const { data, isLoading, error, refetch } = useConfigs();
    const createMutation = useCreateConfig();
    const updateMutation = useUpdateConfig();
    const deleteMutation = useDeleteConfig();

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
    const [collapsed, setCollapsed] = useState<Record<string, true>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(
        null,
    );
    const [editing, setEditing] = useState<Config | null>(null);
    const [form, setForm] = useState<ConfigFormState>(EMPTY_FORM);
    const [touched, setTouched] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<Config | null>(null);

    const configs = useMemo(() => data?.data ?? [], [data]);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return configs.filter((config) => {
            const type = normalizeConfigType(config.type);
            if (typeFilter !== "all" && type !== typeFilter) return false;
            if (!query) return true;
            return (
                config.key.toLowerCase().includes(query) ||
                config.value.toLowerCase().includes(query) ||
                (config.description ?? "").toLowerCase().includes(query)
            );
        });
    }, [configs, search, typeFilter]);

    const groups = useMemo(() => {
        const byNamespace: Record<string, Config[]> = {};
        for (const config of filtered) {
            const namespace = namespaceOf(config.key);
            (byNamespace[namespace] ??= []).push(config);
        }
        return Object.entries(byNamespace)
            .map(([namespace, items]) => ({
                namespace,
                items: [...items].sort((a, b) => a.key.localeCompare(b.key)),
            }))
            .sort((a, b) => {
                // "General" (no namespace) first, then alphabetical.
                if (!a.namespace) return -1;
                if (!b.namespace) return 1;
                return a.namespace.localeCompare(b.namespace);
            });
    }, [filtered]);

    const keyError = useMemo(() => {
        const key = form.key.trim();
        if (!key) return "Key is required.";
        if (key.length > MAX_KEY_LENGTH) {
            return `Key must be at most ${MAX_KEY_LENGTH} characters.`;
        }
        if (!KEY_PATTERN.test(key)) {
            return "Use lowercase letters, digits, and single dots, dashes, or underscores (e.g. editor.autosave.interval.ms).";
        }
        const duplicate = configs.some(
            (config) =>
                config.key === key &&
                (!editing || config.id !== editing.id),
        );
        return duplicate ? "A configuration with this key already exists." : undefined;
    }, [form.key, configs, editing]);

    const valueError = useMemo(
        () => validateConfigValue(form.type, form.value),
        [form.type, form.value],
    );

    const descriptionError =
        form.description.length > MAX_DESCRIPTION_LENGTH
            ? `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`
            : undefined;

    // Surface key problems while typing, not only after blur, so a disabled
    // Create button always explains itself.
    const showKeyError =
        Boolean(keyError) && (touched || form.key.length > 0);

    const formValid =
        !keyError && !valueError && !descriptionError;

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setEditing(null);
        setTouched(false);
        setDialogMode("create");
    };

    const openEdit = (config: Config) => {
        setForm({
            key: config.key,
            type: normalizeConfigType(config.type),
            value: config.value,
            description: config.description ?? "",
        });
        setEditing(config);
        setTouched(false);
        setDialogMode("edit");
    };

    const closeDialog = () => {
        setDialogMode(null);
        setEditing(null);
        setTouched(false);
    };

    const setType = (type: ConfigType) => {
        setForm((current) => ({
            ...current,
            type,
            // Booleans are switch-driven, so invalid text is replaced.
            value:
                type === "boolean" &&
                validateConfigValue("boolean", current.value)
                    ? "true"
                    : current.value,
        }));
    };

    const handleSubmit = async () => {
        setTouched(true);
        if (!formValid) return;

        const payload = {
            key: form.key.trim(),
            value: form.value,
            description: form.description.trim(),
            type: form.type,
        };

        try {
            if (dialogMode === "create") {
                await createMutation.mutateAsync(payload);
                toast({ title: `Created ${payload.key}` });
            } else {
                await updateMutation.mutateAsync(payload);
                toast({ title: `Updated ${payload.key}` });
            }
            closeDialog();
        } catch (mutationError) {
            toast({
                title:
                    dialogMode === "create"
                        ? "Failed to create configuration"
                        : "Failed to update configuration",
                description:
                    mutationError instanceof Error
                        ? mutationError.message
                        : undefined,
                variant: "destructive",
            });
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            toast({
                title: `Deleted ${deleteTarget.key}`,
                description:
                    "Anything still reading this key will fall back to its own default.",
            });
            setDeleteTarget(null);
        } catch (mutationError) {
            toast({
                title: "Failed to delete configuration",
                description:
                    mutationError instanceof Error
                        ? mutationError.message
                        : undefined,
                variant: "destructive",
            });
        }
    };

    const toggleBoolean = (config: Config) => {
        const next = config.value === "true" ? "false" : "true";
        updateMutation.mutate(
            {
                key: config.key,
                value: next,
                description: config.description ?? "",
                type: "boolean",
            },
            {
                onSuccess: () => toast({ title: `${config.key} set to ${next}` }),
                onError: (mutationError) =>
                    toast({
                        title: "Failed to update value",
                        description:
                            mutationError instanceof Error
                                ? mutationError.message
                                : undefined,
                        variant: "destructive",
                    }),
            },
        );
    };

    const copyKey = async (config: Config) => {
        try {
            await navigator.clipboard.writeText(config.key);
            setCopiedId(config.id);
            setTimeout(() => setCopiedId(null), 1500);
        } catch {
            toast({
                title: "Copy failed",
                description: "Clipboard access was denied.",
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-3 rounded-lg border border-dashed p-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    Failed to load configurations.
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Retry
                </Button>
            </div>
        );
    }

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-56 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search keys, values, or descriptions"
                        className="pl-9"
                        aria-label="Search configurations"
                    />
                </div>
                <div
                    role="group"
                    aria-label="Filter by type"
                    className="flex flex-wrap gap-1"
                >
                    {TYPE_FILTERS.map((type) => (
                        <Button
                            key={type}
                            type="button"
                            size="sm"
                            variant={typeFilter === type ? "secondary" : "ghost"}
                            className="h-8 px-2 text-xs capitalize"
                            onClick={() => setTypeFilter(type)}
                        >
                            {type}
                        </Button>
                    ))}
                </div>
                <Button size="sm" onClick={openCreate}>
                    <Plus className="mr-1 h-4 w-4" />
                    New configuration
                </Button>
            </div>

            <p className="text-xs text-muted-foreground">
                {filtered.length === configs.length
                    ? `${configs.length} configuration${configs.length === 1 ? "" : "s"}`
                    : `${filtered.length} of ${configs.length} shown`}
            </p>

            {configs.length === 0 && (
                <div className="space-y-3 rounded-lg border border-dashed p-8 text-center">
                    <KeyRound className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            No configuration yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Keys are namespaced with dots, e.g.{" "}
                            <code className="font-mono text-xs">
                                editor.autosave.interval.ms
                            </code>
                            .
                        </p>
                    </div>
                    <Button size="sm" onClick={openCreate}>
                        <Plus className="mr-1 h-4 w-4" />
                        Create the first configuration
                    </Button>
                </div>
            )}

            {configs.length > 0 && filtered.length === 0 && (
                <div className="space-y-3 rounded-lg border border-dashed p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        No configuration matches your filters.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSearch("");
                            setTypeFilter("all");
                        }}
                    >
                        Clear filters
                    </Button>
                </div>
            )}

            {groups.map(({ namespace, items }) => {
                const collapsedGroup = collapsed[namespace];
                return (
                    <div key={namespace || "__general"} className="space-y-2">
                        <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-accent/60"
                            onClick={() =>
                                setCollapsed((current) => {
                                    const next = { ...current };
                                    if (next[namespace]) delete next[namespace];
                                    else next[namespace] = true;
                                    return next;
                                })
                            }
                            aria-expanded={!collapsedGroup}
                        >
                            {collapsedGroup ? (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-mono text-xs font-medium">
                                {namespace || "general"}
                            </span>
                            <Badge variant="secondary" className="text-[10px]">
                                {items.length}
                            </Badge>
                        </button>

                        {!collapsedGroup && (
                            <div className="overflow-x-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[28%]">
                                                Key
                                            </TableHead>
                                            <TableHead>Value</TableHead>
                                            <TableHead className="w-24">
                                                Type
                                            </TableHead>
                                            <TableHead className="w-[25%]">
                                                Description
                                            </TableHead>
                                            <TableHead className="w-28 text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((config) => {
                                            const type = normalizeConfigType(
                                                config.type,
                                            );
                                            const isToggling =
                                                updateMutation.isPending &&
                                                updateMutation.variables
                                                    ?.key === config.key;
                                            return (
                                                <TableRow
                                                    key={config.id}
                                                    className="group"
                                                >
                                                    <TableCell className="align-top">
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-mono text-sm break-all">
                                                                <span className="text-muted-foreground">
                                                                    {namespace &&
                                                                        `${namespace}.`}
                                                                </span>
                                                                <span className="font-medium">
                                                                    {leafOf(
                                                                        config.key,
                                                                        namespace,
                                                                    )}
                                                                </span>
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                                                                aria-label={`Copy key ${config.key}`}
                                                                onClick={() =>
                                                                    copyKey(
                                                                        config,
                                                                    )
                                                                }
                                                            >
                                                                {copiedId ===
                                                                config.id ? (
                                                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                                ) : (
                                                                    <Copy className="h-3.5 w-3.5" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="align-top">
                                                        {type === "boolean" ? (
                                                            <div className="flex items-center gap-2">
                                                                <Switch
                                                                    checked={
                                                                        config.value ===
                                                                        "true"
                                                                    }
                                                                    disabled={
                                                                        isToggling
                                                                    }
                                                                    onCheckedChange={() =>
                                                                        toggleBoolean(
                                                                            config,
                                                                        )
                                                                    }
                                                                    aria-label={`Toggle ${config.key}`}
                                                                />
                                                                <span className="font-mono text-xs text-muted-foreground">
                                                                    {config.value ===
                                                                    "true"
                                                                        ? "true"
                                                                        : "false"}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span
                                                                className={`block max-w-md truncate font-mono text-xs ${
                                                                    type ===
                                                                        "json" &&
                                                                    valuePreview(
                                                                        config,
                                                                    ) ===
                                                                        "Invalid JSON"
                                                                        ? "text-destructive"
                                                                        : ""
                                                                }`}
                                                                title={
                                                                    config.value
                                                                }
                                                            >
                                                                {valuePreview(
                                                                    config,
                                                                )}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="align-top">
                                                        <TypeBadge type={type} />
                                                    </TableCell>
                                                    <TableCell className="align-top">
                                                        <span
                                                            className="block max-w-xs truncate text-sm text-muted-foreground"
                                                            title={
                                                                config.description
                                                            }
                                                        >
                                                            {config.description ||
                                                                "—"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right align-top">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                aria-label={`Edit ${config.key}`}
                                                                onClick={() =>
                                                                    openEdit(
                                                                        config,
                                                                    )
                                                                }
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                                aria-label={`Delete ${config.key}`}
                                                                onClick={() =>
                                                                    setDeleteTarget(
                                                                        config,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Create / edit */}
            <Dialog
                open={dialogMode !== null}
                onOpenChange={(open) => {
                    if (!open) closeDialog();
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogMode === "create"
                                ? "New configuration"
                                : "Edit configuration"}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogMode === "create"
                                ? "Keys are immutable once created; consumers read them by exact path."
                                : "The key cannot change. Create a new key and migrate consumers to rename."}
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        id="config-form"
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void handleSubmit();
                        }}
                    >
                        <div className="space-y-2">
                            <Label htmlFor="config-key">Key</Label>
                            <Input
                                id="config-key"
                                value={form.key}
                                readOnly={dialogMode === "edit"}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        key: event.target.value,
                                    }))
                                }
                                onBlur={() => setTouched(true)}
                                placeholder="editor.autosave.interval.ms"
                                className="font-mono"
                                aria-invalid={
                                    showKeyError ? true : undefined
                                }
                            />
                            {dialogMode === "edit" ? (
                                <p className="text-xs text-muted-foreground">
                                    Immutable identifier.
                                </p>
                            ) : showKeyError ? (
                                <p className="text-xs text-destructive">
                                    {keyError}
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Lowercase, dot-separated namespace. This is
                                    the exact path code reads.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Type</Label>
                            <ConfigTypePicker
                                value={form.type}
                                onChange={setType}
                            />
                            <ConfigTypeHint type={form.type} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="config-value">Value</Label>
                            <ConfigValueEditor
                                type={form.type}
                                value={form.value}
                                onChange={(value) =>
                                    setForm((current) => ({
                                        ...current,
                                        value,
                                    }))
                                }
                                idPrefix="config"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="config-description">
                                Description{" "}
                                <span className="text-muted-foreground">
                                    (optional)
                                </span>
                            </Label>
                            <Textarea
                                id="config-description"
                                value={form.description}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                                rows={2}
                                placeholder="What this setting controls and who reads it"
                            />
                            {descriptionError && (
                                <p className="text-xs text-destructive">
                                    {descriptionError}
                                </p>
                            )}
                        </div>
                    </form>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeDialog}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="config-form"
                            disabled={!formValid || isSaving}
                        >
                            {dialogMode === "create" ? "Create" : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete */}
            <AlertDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete <code>{deleteTarget?.key}</code>?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            The row is removed permanently. Code still reading
                            this key will fall back to whatever default it
                            defines, or fail if it has none.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => void handleDelete()}
                            disabled={deleteMutation.isPending}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
