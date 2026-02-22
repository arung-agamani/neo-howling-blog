"use client";

import TextField from "@mui/material/TextField";
import { Control, Controller } from "react-hook-form";
import type { GalleryConfigFormValues } from "./formSchema";

interface BackgroundColorSectionProps {
    control: Control<GalleryConfigFormValues>;
}

export default function BackgroundColorSection({
    control,
}: BackgroundColorSectionProps) {
    return (
        <div className="flex items-center gap-4">
            <Controller
                name="color"
                control={control}
                render={({ field, fieldState }) => (
                    <TextField
                        {...field}
                        label="Background Color"
                        placeholder="#09090f"
                        helperText={
                            fieldState.error?.message ??
                            "Any valid CSS color value (hex, rgb, hsl…)"
                        }
                        error={!!fieldState.error}
                        fullWidth
                    />
                )}
            />
            {/* Live swatch */}
            <Controller
                name="color"
                control={control}
                render={({ field }) => (
                    <div
                        className="shrink-0 w-14 h-14 rounded border border-gray-300 shadow-inner"
                        style={{ backgroundColor: field.value || "#09090f" }}
                        title="Color preview"
                    />
                )}
            />
        </div>
    );
}
