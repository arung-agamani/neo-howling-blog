"use client";

import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PermMediaOutlinedIcon from "@mui/icons-material/PermMediaOutlined";
import { useState } from "react";
import { Control, Controller, useWatch, useFormContext } from "react-hook-form";
import type { GalleryConfigFormValues } from "./formSchema";
import { MediaLibrary } from "@/components/Dashboard/MediaLibrary";
import type { MediaItem } from "@/components/Dashboard/MediaLibrary/types";

interface BackgroundImageSectionProps {
    control: Control<GalleryConfigFormValues>;
}

export default function BackgroundImageSection({
    control,
}: BackgroundImageSectionProps) {
    const overlayEnabled = useWatch({ control, name: "overlayEnabled" });
    const { setValue } = useFormContext<GalleryConfigFormValues>();
    const [mediaOpen, setMediaOpen] = useState(false);

    function handleMediaSelect(item: MediaItem) {
        setValue("imageUrl", item.url, { shouldValidate: true });
        setMediaOpen(false);
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Image URL + picker button */}
            <div className="flex gap-2 items-start">
                <Controller
                    name="imageUrl"
                    control={control}
                    render={({ field, fieldState }) => (
                        <TextField
                            {...field}
                            label="Image URL"
                            placeholder="https://example.com/background.jpg"
                            helperText={
                                fieldState.error?.message ??
                                "Full URL of the background image"
                            }
                            error={!!fieldState.error}
                            fullWidth
                        />
                    )}
                />
                <Button
                    variant="outlined"
                    startIcon={<PermMediaOutlinedIcon />}
                    onClick={() => setMediaOpen(true)}
                    sx={{ mt: "4px", whiteSpace: "nowrap", height: 56 }}
                >
                    Media Library
                </Button>
            </div>

            {/* Media Library dialog */}
            <Dialog
                open={mediaOpen}
                onClose={() => setMediaOpen(false)}
                maxWidth="xl"
                fullWidth
                PaperProps={{ sx: { height: "90vh" } }}
            >
                <DialogTitle
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pb: 1,
                    }}
                >
                    Pick a background image
                    <IconButton
                        aria-label="close"
                        onClick={() => setMediaOpen(false)}
                        size="small"
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0, overflow: "hidden" }}>
                    <MediaLibrary
                        selectionMode="single"
                        onSelect={handleMediaSelect}
                    />
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-2 gap-4">
                {/* Size */}
                <Controller
                    name="size"
                    control={control}
                    render={({ field }) => (
                        <FormControl fullWidth>
                            <InputLabel id="bg-size-label">
                                Background Size
                            </InputLabel>
                            <Select
                                {...field}
                                labelId="bg-size-label"
                                label="Background Size"
                            >
                                <MenuItem value="cover">cover</MenuItem>
                                <MenuItem value="contain">contain</MenuItem>
                                <MenuItem value="auto">auto</MenuItem>
                            </Select>
                        </FormControl>
                    )}
                />

                {/* Position */}
                <Controller
                    name="position"
                    control={control}
                    render={({ field }) => (
                        <FormControl fullWidth>
                            <InputLabel id="bg-position-label">
                                Background Position
                            </InputLabel>
                            <Select
                                {...field}
                                labelId="bg-position-label"
                                label="Background Position"
                            >
                                <MenuItem value="center">center</MenuItem>
                                <MenuItem value="top">top</MenuItem>
                                <MenuItem value="bottom">bottom</MenuItem>
                                <MenuItem value="left">left</MenuItem>
                                <MenuItem value="right">right</MenuItem>
                                <MenuItem value="top left">top left</MenuItem>
                                <MenuItem value="top right">top right</MenuItem>
                                <MenuItem value="bottom left">
                                    bottom left
                                </MenuItem>
                                <MenuItem value="bottom right">
                                    bottom right
                                </MenuItem>
                            </Select>
                        </FormControl>
                    )}
                />

                {/* Repeat */}
                <Controller
                    name="repeat"
                    control={control}
                    render={({ field }) => (
                        <FormControl fullWidth>
                            <InputLabel id="bg-repeat-label">
                                Background Repeat
                            </InputLabel>
                            <Select
                                {...field}
                                labelId="bg-repeat-label"
                                label="Background Repeat"
                            >
                                <MenuItem value="no-repeat">no-repeat</MenuItem>
                                <MenuItem value="repeat">repeat</MenuItem>
                                <MenuItem value="repeat-x">repeat-x</MenuItem>
                                <MenuItem value="repeat-y">repeat-y</MenuItem>
                            </Select>
                        </FormControl>
                    )}
                />

                {/* Attachment */}
                <Controller
                    name="attachment"
                    control={control}
                    render={({ field }) => (
                        <FormControl fullWidth>
                            <InputLabel id="bg-attach-label">
                                Background Attachment
                            </InputLabel>
                            <Select
                                {...field}
                                labelId="bg-attach-label"
                                label="Background Attachment"
                            >
                                <MenuItem value="scroll">scroll</MenuItem>
                                <MenuItem value="fixed">fixed</MenuItem>
                                <MenuItem value="local">local</MenuItem>
                            </Select>
                        </FormControl>
                    )}
                />
            </div>

            {/* Overlay */}
            <div className="border border-gray-200 rounded p-4 flex flex-col gap-3">
                <Typography variant="subtitle2">Overlay</Typography>
                <Controller
                    name="overlayEnabled"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={field.value}
                                    onChange={field.onChange}
                                />
                            }
                            label="Enable overlay on image"
                        />
                    )}
                />
                {overlayEnabled && (
                    <div className="flex items-center gap-4">
                        <Controller
                            name="overlayColor"
                            control={control}
                            render={({ field, fieldState }) => (
                                <TextField
                                    {...field}
                                    label="Overlay Color"
                                    placeholder="rgba(0,0,0,0.6)"
                                    helperText={
                                        fieldState.error?.message ??
                                        "CSS color with alpha, e.g. rgba(0,0,0,0.6)"
                                    }
                                    error={!!fieldState.error}
                                    fullWidth
                                />
                            )}
                        />
                        <Controller
                            name="overlayColor"
                            control={control}
                            render={({ field }) => (
                                <div
                                    className="shrink-0 w-14 h-14 rounded border border-gray-300 shadow-inner"
                                    style={{
                                        backgroundColor:
                                            field.value || "rgba(0,0,0,0.6)",
                                    }}
                                    title="Overlay color preview"
                                />
                            )}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
