"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import axios from "@/utils/axios";
import debounce from "lodash.debounce";

interface Tag {
    name: string;
    count?: number;
}

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    maxTags?: number;
}

export default function TagInput({
    value,
    onChange,
    label = "Tags",
    placeholder = "Add tags...",
    disabled = false,
    maxTags,
}: TagInputProps) {
    const [inputValue, setInputValue] = useState("");
    const [options, setOptions] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(false);
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [hasFetchedTags, setHasFetchedTags] = useState(false);

    // Fetch all available tags on mount
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await axios.get("/api/v1/tags");
                const tags = response.data;
                if (Array.isArray(tags)) {
                    setAllTags(
                        tags.map((t: any) => ({
                            name: t.name,
                            count: t.count || 0,
                        }))
                    );
                }
                setHasFetchedTags(true);
            } catch (error) {
                console.error("Failed to fetch tags:", error);
                setHasFetchedTags(true);
            }
        };

        fetchTags();
    }, []);

    // Debounced search for filtering options
    const debouncedSearch = useMemo(
        () =>
            debounce((searchTerm: string) => {
                setLoading(true);
                const term = searchTerm.toLowerCase().trim();

                if (!term) {
                    // Show popular tags when no search term
                    const popularTags = allTags
                        .filter((t) => !value.includes(t.name))
                        .sort((a, b) => (b.count || 0) - (a.count || 0))
                        .slice(0, 10);
                    setOptions(popularTags);
                } else {
                    // Filter tags by search term
                    const filtered = allTags
                        .filter(
                            (t) =>
                                t.name.toLowerCase().includes(term) &&
                                !value.includes(t.name)
                        )
                        .sort((a, b) => {
                            // Prioritize exact matches and prefix matches
                            const aStartsWith = a.name
                                .toLowerCase()
                                .startsWith(term);
                            const bStartsWith = b.name
                                .toLowerCase()
                                .startsWith(term);
                            if (aStartsWith && !bStartsWith) return -1;
                            if (!aStartsWith && bStartsWith) return 1;
                            return (b.count || 0) - (a.count || 0);
                        })
                        .slice(0, 10);
                    setOptions(filtered);
                }
                setLoading(false);
            }, 150),
        [allTags, value]
    );

    useEffect(() => {
        if (hasFetchedTags) {
            debouncedSearch(inputValue);
        }
        return () => {
            debouncedSearch.cancel();
        };
    }, [inputValue, hasFetchedTags, debouncedSearch]);

    const handleAddTag = useCallback(
        (tagName: string) => {
            const trimmed = tagName.trim().toLowerCase();
            if (!trimmed) return;
            if (value.includes(trimmed)) return;
            if (maxTags && value.length >= maxTags) return;

            onChange([...value, trimmed]);
            setInputValue("");
        },
        [value, onChange, maxTags]
    );

    const handleRemoveTag = useCallback(
        (tagToRemove: string) => {
            onChange(value.filter((t) => t !== tagToRemove));
        },
        [value, onChange]
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === "," || event.key === "Enter") {
                event.preventDefault();
                if (inputValue.trim()) {
                    handleAddTag(inputValue);
                }
            } else if (
                event.key === "Backspace" &&
                !inputValue &&
                value.length > 0
            ) {
                // Remove last tag when backspace is pressed on empty input
                handleRemoveTag(value[value.length - 1]);
            }
        },
        [inputValue, value, handleAddTag, handleRemoveTag]
    );

    return (
        <Box sx={{ width: "100%" }}>
            <Autocomplete
                multiple
                freeSolo
                options={options.map((t) => t.name)}
                value={value}
                inputValue={inputValue}
                disabled={disabled}
                loading={loading}
                onInputChange={(_, newInputValue, reason) => {
                    if (reason === "input") {
                        // Handle comma in input
                        if (newInputValue.includes(",")) {
                            const parts = newInputValue.split(",");
                            parts.forEach((part, index) => {
                                if (index < parts.length - 1) {
                                    handleAddTag(part);
                                } else {
                                    setInputValue(part);
                                }
                            });
                        } else {
                            setInputValue(newInputValue);
                        }
                    } else if (reason === "clear") {
                        setInputValue("");
                    }
                }}
                onChange={(_, newValue, reason) => {
                    if (reason === "selectOption" || reason === "createOption") {
                        // Get the newly added value
                        const newTag = newValue[newValue.length - 1];
                        if (typeof newTag === "string") {
                            // Check if it's not already in the list
                            if (!value.includes(newTag.toLowerCase().trim())) {
                                onChange([
                                    ...value,
                                    newTag.toLowerCase().trim(),
                                ]);
                            }
                        }
                        setInputValue("");
                    } else if (reason === "removeOption") {
                        onChange(newValue as string[]);
                    } else if (reason === "clear") {
                        onChange([]);
                    }
                }}
                filterOptions={(options, { inputValue }) => {
                    // Custom filter that also suggests creating new tag
                    const filtered = options.filter(
                        (option) =>
                            option
                                .toLowerCase()
                                .includes(inputValue.toLowerCase()) &&
                            !value.includes(option)
                    );

                    // Suggest creating new tag if it doesn't exist
                    const trimmedInput = inputValue.trim().toLowerCase();
                    if (
                        trimmedInput &&
                        !filtered.some((t) => t.toLowerCase() === trimmedInput) &&
                        !value.includes(trimmedInput)
                    ) {
                        filtered.push(trimmedInput);
                    }

                    return filtered;
                }}
                renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                        const { key, ...otherProps } = getTagProps({ index });
                        return (
                            <Chip
                                key={key}
                                label={option}
                                size="small"
                                color="primary"
                                variant="outlined"
                                {...otherProps}
                                sx={{
                                    borderRadius: "4px",
                                    fontWeight: 500,
                                    "& .MuiChip-deleteIcon": {
                                        color: "primary.main",
                                        "&:hover": {
                                            color: "error.main",
                                        },
                                    },
                                }}
                            />
                        );
                    })
                }
                renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    const tag = allTags.find((t) => t.name === option);
                    const isNew = !tag;

                    return (
                        <li key={key} {...otherProps}>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    width: "100%",
                                    alignItems: "center",
                                }}
                            >
                                <span>
                                    {isNew ? (
                                        <>
                                            Create &quot;
                                            <strong>{option}</strong>&quot;
                                        </>
                                    ) : (
                                        option
                                    )}
                                </span>
                                {tag && tag.count !== undefined && (
                                    <Chip
                                        label={tag.count}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            ml: 1,
                                            height: 20,
                                            fontSize: "0.7rem",
                                        }}
                                    />
                                )}
                            </Box>
                        </li>
                    );
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={label}
                        placeholder={value.length === 0 ? placeholder : ""}
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        onKeyDown={handleKeyDown}
                        helperText={
                            maxTags
                                ? `${value.length}/${maxTags} tags`
                                : "Press Enter or comma to add tags"
                        }
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {loading ? (
                                        <CircularProgress
                                            color="inherit"
                                            size={18}
                                        />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                    />
                )}
                sx={{
                    "& .MuiAutocomplete-inputRoot": {
                        flexWrap: "wrap",
                        gap: 0.5,
                        paddingTop: "8px",
                        paddingBottom: "8px",
                    },
                }}
            />
        </Box>
    );
}
