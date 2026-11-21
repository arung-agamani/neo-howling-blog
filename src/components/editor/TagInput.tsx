"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, X } from "lucide-react";
import { get } from "@/lib/ky/client";
import { cn } from "@/utils/cn";

interface TagOption {
    name: string;
    count?: number;
}

interface Suggestion extends TagOption {
    isNew?: boolean;
}

const SUGGESTION_LIMIT = 8;
const TAGS_QUERY_KEY = ["tags", "options"] as const;

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    maxTags?: number;
    id?: string;
}

/**
 * Tag editor matching the v1 admin behaviour: chips for selected tags, live
 * suggestions from the tags API with usage counts, free-form creation, add on
 * Enter or comma, and Backspace removing the last chip.
 */
export default function TagInput({
    value,
    onChange,
    placeholder = "Add tags…",
    disabled = false,
    maxTags,
    id,
}: TagInputProps) {
    const [input, setInput] = useState("");
    const [open, setOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: allTags = [], isLoading } = useQuery({
        queryKey: TAGS_QUERY_KEY,
        queryFn: async () => {
            try {
                return await get<TagOption[]>("tags");
            } catch (error) {
                // Suggestions are a convenience; free-form entry still works.
                console.error("Failed to load tags:", error);
                return [] as TagOption[];
            }
        },
        staleTime: 5 * 60 * 1000,
    });

    const term = input.trim().toLowerCase();

    const options = useMemo<Suggestion[]>(() => {
        const available = allTags.filter((tag) => !value.includes(tag.name));

        const matching = available
            .filter((tag) => !term || tag.name.toLowerCase().includes(term))
            .sort((a, b) => {
                const aPrefix = a.name.toLowerCase().startsWith(term);
                const bPrefix = b.name.toLowerCase().startsWith(term);
                if (aPrefix !== bPrefix) return aPrefix ? -1 : 1;
                return (b.count ?? 0) - (a.count ?? 0);
            })
            .slice(0, SUGGESTION_LIMIT);

        const exactMatch = allTags.some(
            (tag) => tag.name.toLowerCase() === term,
        );
        const canCreate =
            term.length > 0 && !exactMatch && !value.includes(term);

        return canCreate ? [...matching, { name: term, isNew: true }] : matching;
    }, [allTags, value, term]);

    const atLimit = maxTags !== undefined && value.length >= maxTags;

    const addTag = (raw: string) => {
        const name = raw.trim().toLowerCase();
        if (!name || disabled || atLimit) return;
        if (value.includes(name)) {
            setInput("");
            return;
        }
        onChange([...value, name]);
        setInput("");
        setHighlight(0);
    };

    const removeTag = (name: string) => {
        if (disabled) return;
        onChange(value.filter((tag) => tag !== name));
    };

    const handleInputChange = (raw: string) => {
        if (raw.includes(",")) {
            const parts = raw.split(",");
            // Add every completed segment, keep the trailing text editable.
            for (const part of parts.slice(0, -1)) addTag(part);
            setInput(parts[parts.length - 1]);
            setHighlight(0);
            setOpen(true);
            return;
        }
        setInput(raw);
        setHighlight(0);
        setOpen(true);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            const highlighted = options[highlight];
            if (highlighted) addTag(highlighted.name);
            else if (input.trim()) addTag(input);
            return;
        }

        if (event.key === ",") {
            event.preventDefault();
            if (input.trim()) addTag(input);
            return;
        }

        if (event.key === "Backspace" && !input && value.length > 0) {
            event.preventDefault();
            removeTag(value[value.length - 1]);
            return;
        }

        if (event.key === "ArrowDown" && options.length > 0) {
            event.preventDefault();
            setOpen(true);
            setHighlight((current) => (current + 1) % options.length);
            return;
        }

        if (event.key === "ArrowUp" && options.length > 0) {
            event.preventDefault();
            setOpen(true);
            setHighlight(
                (current) => (current - 1 + options.length) % options.length,
            );
            return;
        }

        if (event.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <div className="relative">
            <div
                className={cn(
                    "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-sm focus-within:ring-1 focus-within:ring-ring",
                    disabled && "pointer-events-none opacity-60",
                )}
                onClick={() => inputRef.current?.focus()}
            >
                {value.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs font-medium"
                    >
                        {tag}
                        <button
                            type="button"
                            aria-label={`Remove tag ${tag}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                removeTag(tag);
                            }}
                            className="rounded text-muted-foreground hover:text-destructive"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                ))}

                <input
                    id={id}
                    ref={inputRef}
                    value={input}
                    onChange={(event) => handleInputChange(event.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setOpen(false)}
                    placeholder={
                        value.length === 0 && !atLimit ? placeholder : ""
                    }
                    disabled={disabled || atLimit}
                    role="combobox"
                    aria-expanded={open}
                    aria-autocomplete="list"
                    aria-controls="tag-suggestions"
                    aria-activedescendant={
                        open && options[highlight]
                            ? `tag-option-${highlight}`
                            : undefined
                    }
                    className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />

                {isLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
            </div>

            {open && options.length > 0 && (
                <ul
                    id="tag-suggestions"
                    role="listbox"
                    aria-label="Tag suggestions"
                    className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover p-1 text-sm shadow-md"
                >
                    {options.map((option, index) => (
                        <li
                            key={option.name}
                            id={`tag-option-${index}`}
                            role="option"
                            aria-selected={index === highlight}
                            // Keep the input focused so the click lands.
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setHighlight(index)}
                            onClick={() => addTag(option.name)}
                            className={cn(
                                "flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5",
                                index === highlight && "bg-accent",
                            )}
                        >
                            <span className="flex items-center gap-1.5">
                                {option.isNew ? (
                                    <>
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>
                                            Create{" "}
                                            <strong className="font-medium">
                                                {option.name}
                                            </strong>
                                        </span>
                                    </>
                                ) : (
                                    <span>{option.name}</span>
                                )}
                            </span>
                            {!option.isNew && option.count !== undefined && (
                                <span className="rounded border px-1 text-[10px] tabular-nums text-muted-foreground">
                                    {option.count}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <p className="mt-1 text-xs text-muted-foreground">
                {maxTags
                    ? `${value.length}/${maxTags} tags · press Enter or comma to add`
                    : "Press Enter or comma to add a tag"}
            </p>
        </div>
    );
}
