"use client";

import { useMemo } from "react";
import { AlertCircle, CheckCircle2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { ConfigType } from "@/hooks/api/useConfig";

const CONFIG_TYPE_LABEL: Record<ConfigType, string> = {
    string: "String",
    number: "Number",
    boolean: "Boolean",
    json: "JSON",
};

const CONFIG_TYPE_HINT: Record<ConfigType, string> = {
    string: "Free-form text, file paths, URLs, or identifiers.",
    number: "Integer or decimal. Stored as text, parsed as a number.",
    boolean: "On or off. Stored as the text true or false.",
    json: "Structured data. Consumers parse it with JSON.parse.",
};

export const CONFIG_TYPES: ConfigType[] = [
    "string",
    "number",
    "boolean",
    "json",
];

/** Normalize a legacy row (type null) to the string type. */
export function normalizeConfigType(type?: ConfigType | null): ConfigType {
    return type ?? "string";
}

/** Returns an error message, or undefined when the value is valid. */
export function validateConfigValue(
    type: ConfigType,
    value: string,
): string | undefined {
    switch (type) {
        case "string":
            return value.length > 10_000
                ? "Value must be at most 10,000 characters."
                : undefined;
        case "number":
            return value.trim() === "" || !Number.isFinite(Number(value))
                ? "Enter a valid number."
                : undefined;
        case "boolean":
            return value === "true" || value === "false"
                ? undefined
                : "Value must be true or false.";
        case "json":
            if (!value.trim()) return 'Enter JSON, e.g. { "enabled": true }.';
            try {
                JSON.parse(value);
                return undefined;
            } catch (error) {
                return error instanceof Error
                    ? `Invalid JSON: ${error.message}`
                    : "Invalid JSON.";
            }
    }
}

/** Pretty-print JSON when it parses; returns null otherwise. */
export function formatConfigValue(
    type: ConfigType,
    value: string,
): string | null {
    if (type !== "json") return null;
    try {
        return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
        return null;
    }
}

export function ConfigTypePicker({
    value,
    onChange,
    disabled,
}: {
    value: ConfigType;
    onChange: (type: ConfigType) => void;
    disabled?: boolean;
}) {
    return (
        <div
            role="radiogroup"
            aria-label="Value type"
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
            {CONFIG_TYPES.map((type) => {
                const active = value === type;
                return (
                    <button
                        key={type}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={disabled}
                        onClick={() => onChange(type)}
                        className={`rounded-md border px-3 py-2 text-left transition-colors ${
                            active
                                ? "border-primary bg-accent"
                                : "hover:bg-accent/60"
                        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                        <span className="block text-sm font-medium">
                            {CONFIG_TYPE_LABEL[type]}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

export function ConfigTypeHint({ type }: { type: ConfigType }) {
    return (
        <p className="text-xs text-muted-foreground">
            {CONFIG_TYPE_HINT[type]}
        </p>
    );
}

/**
 * Value editor that matches the selected type. Validation lives here too so
 * the dialog can block saving with a specific reason.
 */
export function ConfigValueEditor({
    type,
    value,
    onChange,
    idPrefix,
}: {
    type: ConfigType;
    value: string;
    onChange: (value: string) => void;
    idPrefix: string;
}) {
    const valueId = `${idPrefix}-value`;
    const error = validateConfigValue(type, value);
    const formatted = useMemo(
        () => formatConfigValue(type, value),
        [type, value],
    );

    if (type === "boolean") {
        const checked = value === "true";
        return (
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="font-mono text-sm">
                    {checked ? "true" : "false"}
                </span>
                <Switch
                    id={valueId}
                    checked={checked}
                    onCheckedChange={(next) =>
                        onChange(next ? "true" : "false")
                    }
                    aria-label="Boolean value"
                />
            </div>
        );
    }

    if (type === "json") {
        const canFormat = formatted !== null && formatted !== value;
        return (
            <div className="space-y-2">
                <Textarea
                    id={valueId}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    rows={8}
                    spellCheck={false}
                    className="font-mono text-xs"
                    placeholder={'{\n  "enabled": true\n}'}
                />
                <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-xs">
                        {error ? (
                            <>
                                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                                <span className="text-destructive">
                                    {error}
                                </span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span className="text-muted-foreground">
                                    Valid JSON
                                </span>
                            </>
                        )}
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={!canFormat}
                        onClick={() => {
                            if (formatted !== null) onChange(formatted);
                        }}
                    >
                        <Wand2 className="mr-1 h-3.5 w-3.5" />
                        Format
                    </Button>
                </div>
            </div>
        );
    }

    if (type === "number") {
        return (
            <div className="space-y-1">
                <Input
                    id={valueId}
                    inputMode="decimal"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="30"
                    className="font-mono"
                />
                {error && (
                    <p className="text-xs text-destructive">{error}</p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <Textarea
                id={valueId}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                rows={3}
                placeholder="Configuration value"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Plain text; newlines are preserved.</span>
                <span className="tabular-nums">{value.length} chars</span>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
