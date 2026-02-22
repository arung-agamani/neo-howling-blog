"use client";

import axios from "@/utils/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import SaveAlt from "@mui/icons-material/SaveAlt";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import BackgroundColorSection from "./BackgroundColorSection";
import BackgroundImageSection from "./BackgroundImageSection";
import GalleryConfigPreview from "./GalleryConfigPreview";
import type { GalleryBackground, GalleryConfig } from "@/types/GalleryConfig";
import { GALLERY_CONFIG_KEY } from "@/types/GalleryConfig";
import { FormSchema, type GalleryConfigFormValues } from "./formSchema";

// ─── Form schema (defined in formSchema.ts) ──────────────────────────────────

// (imported above)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function configToForm(config: GalleryConfig): GalleryConfigFormValues {
    const bg = config.background;
    if (bg.type === "color") {
        return {
            backgroundType: "color",
            color: bg.color,
            imageUrl: "",
            size: "cover",
            position: "center",
            repeat: "no-repeat",
            attachment: "scroll",
            overlayEnabled: false,
            overlayColor: "rgba(0,0,0,0.6)",
        };
    }
    return {
        backgroundType: "image",
        color: "#09090f",
        imageUrl: bg.imageUrl,
        size: bg.size,
        position: bg.position,
        repeat: bg.repeat,
        attachment: bg.attachment,
        overlayEnabled: bg.overlay?.enabled ?? false,
        overlayColor: bg.overlay?.color ?? "rgba(0,0,0,0.6)",
    };
}

function formToConfig(values: GalleryConfigFormValues): GalleryConfig {
    if (values.backgroundType === "color") {
        return { background: { type: "color", color: values.color } };
    }
    return {
        background: {
            type: "image",
            imageUrl: values.imageUrl,
            size: values.size,
            position: values.position,
            repeat: values.repeat,
            attachment: values.attachment,
            overlay: {
                enabled: values.overlayEnabled,
                color: values.overlayColor,
            },
        },
    };
}

function formToBackground(values: GalleryConfigFormValues): GalleryBackground {
    return formToConfig(values).background;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GalleryConfigForm() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { handleSubmit, control, reset } = useForm<GalleryConfigFormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            backgroundType: "color",
            color: "#09090f",
            imageUrl: "",
            size: "cover",
            position: "center",
            repeat: "no-repeat",
            attachment: "scroll",
            overlayEnabled: false,
            overlayColor: "rgba(0,0,0,0.6)",
        },
    });

    // Live values for the preview
    const watchedValues = useWatch({ control });

    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get<{
                    success: boolean;
                    data: {
                        id: string;
                        key: string;
                        value: string;
                        type: string;
                        description: string;
                    };
                }>(`/api/v1/config?key=${GALLERY_CONFIG_KEY}`, {
                    withCredentials: true,
                });
                const config: GalleryConfig = JSON.parse(res.data.data.value);
                reset(configToForm(config));
            } catch {
                // Key doesn't exist yet — default form values are fine
            } finally {
                setLoading(false);
            }
        })();
    }, [reset]);

    async function onSubmit(values: GalleryConfigFormValues) {
        setSaving(true);
        try {
            const config = formToConfig(values);
            await axios.put(
                "/api/v1/config",
                {
                    key: GALLERY_CONFIG_KEY,
                    value: JSON.stringify(config),
                    type: "json",
                    description: "Gallery page appearance configuration",
                },
                { withCredentials: true },
            );
            toast.success("Gallery configuration saved");
        } catch {
            toast.error("Failed to save gallery configuration");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <Paper sx={{ padding: "2rem" }}>
                <Skeleton variant="text" width={300} height={40} />
                <Skeleton variant="text" width={500} height={24} />
                <Skeleton
                    variant="rectangular"
                    height={120}
                    sx={{ mt: 2, borderRadius: 1 }}
                />
                <Skeleton
                    variant="rectangular"
                    height={56}
                    sx={{ mt: 2, borderRadius: 1 }}
                />
            </Paper>
        );
    }

    return (
        <Paper sx={{ padding: "2rem" }}>
            <Typography variant="h4">Gallery Configuration</Typography>
            <Typography variant="body1" color="text.secondary" mt={0.5}>
                Control the visual appearance of the public gallery page.
            </Typography>
            <Divider sx={{ my: 2 }} />

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-6"
            >
                {/* Background type selector */}
                <div>
                    <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
                        Background Type
                    </Typography>
                    <Controller
                        name="backgroundType"
                        control={control}
                        render={({ field }) => (
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel id="bg-type-label">
                                    Type
                                </InputLabel>
                                <Select
                                    {...field}
                                    labelId="bg-type-label"
                                    label="Type"
                                >
                                    <MenuItem value="color">
                                        Solid Color
                                    </MenuItem>
                                    <MenuItem value="image">Image</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                    />
                </div>

                <Divider />

                {/* Conditional section */}
                <div>
                    <Typography variant="subtitle1" fontWeight={600} mb={1.5}>
                        {watchedValues.backgroundType === "image"
                            ? "Image Settings"
                            : "Color Settings"}
                    </Typography>
                    {watchedValues.backgroundType === "image" ? (
                        <BackgroundImageSection control={control} />
                    ) : (
                        <BackgroundColorSection control={control} />
                    )}
                </div>

                <Divider />

                {/* Live preview */}
                <GalleryConfigPreview
                    background={
                        formToBackground(
                            watchedValues as GalleryConfigFormValues,
                        )
                    }
                />

                <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                    startIcon={<SaveAlt />}
                    sx={{ alignSelf: "flex-start" }}
                >
                    {saving ? "Saving…" : "Save Configuration"}
                </Button>
            </form>
        </Paper>
    );
}
