"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, RotateCcw, Save, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
import { del, get, put } from "@/lib/ky/client";
import { applyThemeColors } from "@/components/theme/applyThemeColors";
import { hslTripletToHex, hexToHslTriplet } from "@/components/theme/themeColorConvert";
import {
    HSL_TRIPLET_PATTERN,
    THEME_COLOR_GROUPS,
    THEME_COLOR_LABELS,
    THEME_COLOR_TOKENS,
} from "@/components/theme/themeTokens";
import type {
    ThemeColorMap,
    ThemeColorToken,
    ThemeColors,
    ThemeMode,
} from "@/components/theme/themeTokens";

const THEME_ENDPOINT = "config/theme";
const themeQueryKey = ["theme-colors"] as const;

interface ThemeResponse {
    success: boolean;
    data: {
        overrides: ThemeColors;
        effective: ThemeColors;
        defaults: ThemeColors;
    };
}

type Draft = Record<ThemeMode, ThemeColorMap>;
type PendingResets = Record<ThemeMode, Partial<Record<ThemeColorToken, true>>>;

const EMPTY_RESETS: PendingResets = { light: {}, dark: {} };

const MODE_LABEL: Record<ThemeMode, string> = {
    light: "Light",
    dark: "Dark",
};

function colorsEqual(a: ThemeColorMap, b: ThemeColorMap): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

export default function ThemeSettings() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: themeQueryKey,
        queryFn: async () => (await get<ThemeResponse>(THEME_ENDPOINT)).data,
    });

    const [mode, setMode] = useState<ThemeMode>("light");
    const [draft, setDraft] = useState<Draft | null>(null);
    const [pendingResets, setPendingResets] =
        useState<PendingResets>(EMPTY_RESETS);
    const [confirmResetAll, setConfirmResetAll] = useState(false);

    useEffect(() => {
        if (!data) return;
        setDraft({
            light: { ...data.effective.light },
            dark: { ...data.effective.dark },
        });
        setPendingResets(EMPTY_RESETS);
    }, [data]);

    const invalidTokens = useMemo(() => {
        if (!draft) return [] as Array<[ThemeMode, ThemeColorToken]>;
        const invalid: Array<[ThemeMode, ThemeColorToken]> = [];
        for (const currentMode of ["light", "dark"] as ThemeMode[]) {
            for (const token of THEME_COLOR_TOKENS) {
                const value = draft[currentMode][token];
                if (value && !HSL_TRIPLET_PATTERN.test(value)) {
                    invalid.push([currentMode, token]);
                }
            }
        }
        return invalid;
    }, [draft]);

    const payload = useMemo(() => {
        if (!draft || !data) return null;

        const changes: {
            light: Record<string, string | null>;
            dark: Record<string, string | null>;
        } = { light: {}, dark: {} };

        for (const currentMode of ["light", "dark"] as ThemeMode[]) {
            for (const token of THEME_COLOR_TOKENS) {
                if (pendingResets[currentMode][token]) {
                    changes[currentMode][token] = null;
                    continue;
                }
                const next = draft[currentMode][token];
                const previous = data.effective[currentMode][token];
                if (next !== previous) {
                    changes[currentMode][token] = next ?? null;
                }
            }
        }

        const hasChanges =
            Object.keys(changes.light).length > 0 ||
            Object.keys(changes.dark).length > 0;
        return hasChanges ? changes : null;
    }, [draft, data, pendingResets]);

    const saveMutation = useMutation({
        mutationFn: async () =>
            (await put<ThemeResponse>(THEME_ENDPOINT, payload ?? {})).data,
        onSuccess: (result) => {
            queryClient.setQueryData(themeQueryKey, result);
            applyThemeColors(result.overrides);
            setPendingResets(EMPTY_RESETS);
            toast({ title: "Appearance saved" });
        },
        onError: (error) =>
            toast({
                title: "Failed to save appearance",
                description: error.message,
                variant: "destructive",
            }),
    });

    const resetMutation = useMutation({
        mutationFn: async () =>
            (await del<ThemeResponse>(THEME_ENDPOINT)).data,
        onSuccess: (result) => {
            queryClient.setQueryData(themeQueryKey, result);
            applyThemeColors(result.overrides);
            setPendingResets(EMPTY_RESETS);
            setConfirmResetAll(false);
            toast({ title: "Appearance reset to defaults" });
        },
        onError: (error) =>
            toast({
                title: "Failed to reset appearance",
                description: error.message,
                variant: "destructive",
            }),
    });

    if (isLoading || (!draft && !isError)) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (isError || !draft || !data) {
        return (
            <div className="space-y-3 rounded-lg border border-dashed p-8 text-center">
                <AlertCircle className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    Failed to load theme colours.
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Retry
                </Button>
            </div>
        );
    }

    const isDirty = payload !== null;
    const isSaving = saveMutation.isPending || resetMutation.isPending;

    const setToken = (token: ThemeColorToken, value: string) => {
        setDraft((current) =>
            current
                ? {
                      ...current,
                      [mode]: { ...current[mode], [token]: value },
                  }
                : current,
        );
        setPendingResets((current) => {
            if (!current[mode][token]) return current;
            const next = { ...current, [mode]: { ...current[mode] } };
            delete next[mode][token];
            return next;
        });
    };

    const resetToken = (token: ThemeColorToken) => {
        setDraft((current) =>
            current
                ? {
                      ...current,
                      [mode]: {
                          ...current[mode],
                          [token]: data.defaults[mode][token],
                      },
                  }
                : current,
        );
        setPendingResets((current) => ({
            ...current,
            [mode]: { ...current[mode], [token]: true },
        }));
    };

    const isOverridden = (token: ThemeColorToken) =>
        Boolean(data.overrides[mode][token]) && !pendingResets[mode][token];

    const previewVars = Object.fromEntries(
        THEME_COLOR_TOKENS.map((token) => [
            `--${token}`,
            draft[mode][token] ?? data.defaults[mode][token],
        ]),
    ) as React.CSSProperties;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                <div className="flex gap-1" role="tablist" aria-label="Colour mode">
                    {(["light", "dark"] as ThemeMode[]).map((option) => (
                        <Button
                            key={option}
                            type="button"
                            size="sm"
                            variant={mode === option ? "secondary" : "ghost"}
                            className="h-8 px-3 text-xs"
                            role="tab"
                            aria-selected={mode === option}
                            onClick={() => setMode(option)}
                        >
                            {MODE_LABEL[option]}
                        </Button>
                    ))}
                </div>

                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    {isDirty ? (
                        <>
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Unsaved changes
                        </>
                    ) : (
                        "Saved"
                    )}
                </p>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmResetAll(true)}
                        disabled={isSaving}
                    >
                        <RotateCcw className="mr-1 h-4 w-4" />
                        Reset all
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => saveMutation.mutate()}
                        disabled={!isDirty || invalidTokens.length > 0 || isSaving}
                    >
                        <Save className="mr-1 h-4 w-4" />
                        Save
                    </Button>
                </div>
            </div>

            {invalidTokens.length > 0 && (
                <p className="flex items-center gap-2 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {invalidTokens.length} colour
                    {invalidTokens.length === 1 ? "" : "s"} must look like
                    <code className="font-mono">220 13% 91%</code>.
                </p>
            )}

            {/* Live preview uses the draft values for the selected mode. */}
            <div className={mode === "dark" ? "dark" : undefined}>
                <div
                    style={previewVars}
                    className="rounded-lg border bg-background p-4 text-foreground"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium">Preview</span>
                        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {mode} mode
                        </span>
                    </div>
                    <p className="mb-3 text-sm text-muted-foreground">
                        Body text uses the foreground token; this line uses
                        muted.
                    </p>
                    <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
                            Primary
                        </span>
                        <span className="rounded-md bg-secondary px-3 py-1.5 text-sm text-secondary-foreground">
                            Secondary
                        </span>
                        <span className="rounded-md bg-destructive px-3 py-1.5 text-sm text-destructive-foreground">
                            Destructive
                        </span>
                        <span className="rounded-md bg-accent px-3 py-1.5 text-sm text-accent-foreground">
                            Accent
                        </span>
                    </div>
                    <div className="rounded-md border border-input px-3 py-1.5 text-sm text-muted-foreground">
                        Input border
                    </div>
                </div>
            </div>

            {THEME_COLOR_GROUPS.map((group) => (
                <section key={group.label} className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.label}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {group.tokens.map((token) => {
                            const value = draft[mode][token] ?? "";
                            const invalid =
                                Boolean(value) &&
                                !HSL_TRIPLET_PATTERN.test(value);

                            return (
                                <div
                                    key={token}
                                    className="flex items-center gap-3 rounded-md border p-2"
                                >
                                    <input
                                        type="color"
                                        aria-label={`${THEME_COLOR_LABELS[token]} colour`}
                                        value={hslTripletToHex(value)}
                                        onChange={(event) =>
                                            setToken(
                                                token,
                                                hexToHslTriplet(
                                                    event.target.value,
                                                ),
                                            )
                                        }
                                        className="h-9 w-10 shrink-0 cursor-pointer rounded border bg-transparent"
                                    />
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-xs font-medium">
                                                {THEME_COLOR_LABELS[token]}
                                            </span>
                                            {isOverridden(token) && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px]"
                                                >
                                                    override
                                                </Badge>
                                            )}
                                        </div>
                                        <Input
                                            value={value}
                                            onChange={(event) =>
                                                setToken(
                                                    token,
                                                    event.target.value,
                                                )
                                            }
                                            aria-label={`${THEME_COLOR_LABELS[token]} HSL value`}
                                            aria-invalid={
                                                invalid ? true : undefined
                                            }
                                            className={`h-8 font-mono text-xs ${
                                                invalid
                                                    ? "border-destructive"
                                                    : ""
                                            }`}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0"
                                        aria-label={`Reset ${THEME_COLOR_LABELS[token]}`}
                                        title={`Default: ${data.defaults[mode][token]}`}
                                        disabled={!isOverridden(token)}
                                        onClick={() => resetToken(token)}
                                    >
                                        <Undo2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            ))}

            <Separator />

            <p className="text-xs text-muted-foreground">
                Tokens are stored as HSL triplets and applied as CSS variables
                to the admin UI, including dialogs and popovers. Tokens without
                an override keep the values shipped in{" "}
                <code className="font-mono">globals.css</code>.
            </p>

            <AlertDialog
                open={confirmResetAll}
                onOpenChange={setConfirmResetAll}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Reset appearance to defaults?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Every colour override for both light and dark mode is
                            deleted. Unsaved changes on this page are discarded.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => resetMutation.mutate()}
                            disabled={resetMutation.isPending}
                        >
                            Reset everything
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
