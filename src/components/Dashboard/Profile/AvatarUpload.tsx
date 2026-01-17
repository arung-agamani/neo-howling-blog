import React, { useState } from "react";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

interface AvatarUploadProps {
    currentAvatarUrl?: string;
    username: string;
    onSave: (avatarUrl: string) => Promise<void>;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
    currentAvatarUrl,
    username,
    onSave,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || "");
    const [previewUrl, setPreviewUrl] = useState(currentAvatarUrl || "");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setAvatarUrl(url);
        setError(null);

        // Simple URL validation for preview
        if (url === "" || url.match(/^https?:\/\/.+/)) {
            setPreviewUrl(url);
        }
    };

    const handleSave = async () => {
        if (avatarUrl && !avatarUrl.match(/^https?:\/\/.+/)) {
            setError("Please enter a valid URL starting with http:// or https://");
            return;
        }

        setIsLoading(true);
        try {
            await onSave(avatarUrl);
            setIsEditing(false);
        } catch (err) {
            setError("Failed to save avatar");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setAvatarUrl(currentAvatarUrl || "");
        setPreviewUrl(currentAvatarUrl || "");
        setError(null);
        setIsEditing(false);
    };

    // Generate initials from username
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
            }}
        >
            <Box sx={{ position: "relative" }}>
                <Avatar
                    src={previewUrl || undefined}
                    alt={username}
                    sx={{
                        width: 150,
                        height: 150,
                        fontSize: "3rem",
                        bgcolor: "primary.main",
                        border: "4px solid",
                        borderColor: "background.paper",
                        boxShadow: 3,
                    }}
                >
                    {!previewUrl && getInitials(username)}
                </Avatar>
                {!isEditing && (
                    <IconButton
                        onClick={() => setIsEditing(true)}
                        sx={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            bgcolor: "primary.main",
                            color: "white",
                            "&:hover": {
                                bgcolor: "primary.dark",
                            },
                            boxShadow: 2,
                        }}
                        size="small"
                    >
                        <PhotoCameraIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>

            {isEditing ? (
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        width: "100%",
                        maxWidth: 400,
                    }}
                >
                    <TextField
                        fullWidth
                        label="Avatar URL"
                        placeholder="https://example.com/avatar.jpg"
                        value={avatarUrl}
                        onChange={handleUrlChange}
                        error={!!error}
                        helperText={
                            error ||
                            "Enter a URL to an image (JPG, PNG, GIF, WebP)"
                        }
                        size="small"
                        disabled={isLoading}
                    />
                    <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleSave}
                            disabled={isLoading}
                            startIcon={
                                isLoading ? (
                                    <CircularProgress size={16} color="inherit" />
                                ) : (
                                    <CheckIcon />
                                )
                            }
                        >
                            Save
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleCancel}
                            disabled={isLoading}
                            startIcon={<CloseIcon />}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            ) : (
                <Typography variant="body2" color="text.secondary">
                    Click the camera icon to change your avatar
                </Typography>
            )}
        </Box>
    );
};

export default AvatarUpload;
