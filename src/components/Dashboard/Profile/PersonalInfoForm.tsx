import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import { ProfileUpdateSchema, TProfileUpdate, GenderOptions } from "./types";

interface PersonalInfoFormProps {
    initialData: {
        name?: string;
        birthday?: Date;
        gender?: string;
        phone?: string;
        bio?: string;
    };
    onSave: (data: TProfileUpdate) => Promise<void>;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
    initialData,
    onSave,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const formatDateForInput = (date?: Date) => {
        if (!date) return "";
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<TProfileUpdate>({
        resolver: zodResolver(ProfileUpdateSchema),
        defaultValues: {
            name: initialData.name || "",
            birthday: formatDateForInput(initialData.birthday),
            gender: (initialData.gender as "male" | "female") || undefined,
            phone: initialData.phone || "",
            bio: initialData.bio || "",
        },
    });

    const onSubmit = async (data: TProfileUpdate) => {
        setIsLoading(true);
        try {
            await onSave(data);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        reset();
        setIsEditing(false);
    };

    const formatDisplayDate = (date?: Date) => {
        if (!date) return "Not set";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatGender = (gender?: string) => {
        if (!gender) return "Not set";
        return gender.charAt(0).toUpperCase() + gender.slice(1);
    };

    if (!isEditing) {
        return (
            <Box>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <Box>
                            <Box
                                component="span"
                                sx={{
                                    color: "text.secondary",
                                    fontSize: "0.875rem",
                                    display: "block",
                                    mb: 0.5,
                                }}
                            >
                                Full Name
                            </Box>
                            <Box
                                component="span"
                                sx={{ fontWeight: 500, fontSize: "1rem" }}
                            >
                                {initialData.name || "Not set"}
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Box>
                            <Box
                                component="span"
                                sx={{
                                    color: "text.secondary",
                                    fontSize: "0.875rem",
                                    display: "block",
                                    mb: 0.5,
                                }}
                            >
                                Birthday
                            </Box>
                            <Box
                                component="span"
                                sx={{ fontWeight: 500, fontSize: "1rem" }}
                            >
                                {formatDisplayDate(initialData.birthday)}
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Box>
                            <Box
                                component="span"
                                sx={{
                                    color: "text.secondary",
                                    fontSize: "0.875rem",
                                    display: "block",
                                    mb: 0.5,
                                }}
                            >
                                Gender
                            </Box>
                            <Box
                                component="span"
                                sx={{ fontWeight: 500, fontSize: "1rem" }}
                            >
                                {formatGender(initialData.gender)}
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Box>
                            <Box
                                component="span"
                                sx={{
                                    color: "text.secondary",
                                    fontSize: "0.875rem",
                                    display: "block",
                                    mb: 0.5,
                                }}
                            >
                                Phone
                            </Box>
                            <Box
                                component="span"
                                sx={{ fontWeight: 500, fontSize: "1rem" }}
                            >
                                {initialData.phone || "Not set"}
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Box>
                            <Box
                                component="span"
                                sx={{
                                    color: "text.secondary",
                                    fontSize: "0.875rem",
                                    display: "block",
                                    mb: 0.5,
                                }}
                            >
                                Bio
                            </Box>
                            <Box
                                component="span"
                                sx={{
                                    fontWeight: 500,
                                    fontSize: "1rem",
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {initialData.bio || "No bio provided"}
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
                <Box
                    sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}
                >
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => setIsEditing(true)}
                    >
                        Edit Information
                    </Button>
                </Box>
            </Box>
        );
    }

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Full Name"
                                placeholder="Enter your full name"
                                error={!!errors.name}
                                helperText={errors.name?.message}
                                disabled={isLoading}
                            />
                        )}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Controller
                        name="birthday"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                type="date"
                                label="Birthday"
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                error={!!errors.birthday}
                                helperText={errors.birthday?.message}
                                disabled={isLoading}
                            />
                        )}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Controller
                        name="gender"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                select
                                fullWidth
                                label="Gender"
                                error={!!errors.gender}
                                helperText={errors.gender?.message}
                                disabled={isLoading}
                                value={field.value || ""}
                            >
                                <MenuItem value="">
                                    <em>Prefer not to say</em>
                                </MenuItem>
                                {GenderOptions.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option.charAt(0).toUpperCase() +
                                            option.slice(1)}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Controller
                        name="phone"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Phone Number"
                                placeholder="+1 234 567 8900"
                                error={!!errors.phone}
                                helperText={errors.phone?.message}
                                disabled={isLoading}
                            />
                        )}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Controller
                        name="bio"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                multiline
                                rows={4}
                                label="Bio"
                                placeholder="Tell us a little about yourself..."
                                error={!!errors.bio}
                                helperText={
                                    errors.bio?.message ||
                                    `${(field.value || "").length}/500 characters`
                                }
                                disabled={isLoading}
                            />
                        )}
                    />
                </Grid>
            </Grid>
            <Box
                sx={{
                    mt: 3,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 2,
                }}
            >
                <Button
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    onClick={handleCancel}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    startIcon={
                        isLoading ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <SaveIcon />
                        )
                    }
                    disabled={isLoading || !isDirty}
                >
                    Save Changes
                </Button>
            </Box>
        </Box>
    );
};

export default PersonalInfoForm;
