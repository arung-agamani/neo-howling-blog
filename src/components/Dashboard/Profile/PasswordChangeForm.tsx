import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LockIcon from "@mui/icons-material/Lock";
import { PasswordChangeSchema, TPasswordChange } from "./types";
import axios from "@/utils/axios";
import { toast } from "react-toastify";

interface PasswordChangeFormProps {
    onSuccess?: () => void;
}

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TPasswordChange>({
        resolver: zodResolver(PasswordChangeSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
        },
    });

    const onSubmit = async (data: TPasswordChange) => {
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await axios.post("/api/v1/auth/password", data);

            if (response.data.success) {
                setSuccess(true);
                toast.success("Password changed successfully!");
                reset();
                onSuccess?.();
            } else {
                setError(response.data.message || "Failed to change password");
            }
        } catch (err: any) {
            const message =
                err.response?.data?.message ||
                "An error occurred while changing password";
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Collapse in={!!error}>
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Collapse>

            <Collapse in={success}>
                <Alert
                    severity="success"
                    sx={{ mb: 2 }}
                    onClose={() => setSuccess(false)}
                >
                    Password changed successfully!
                </Alert>
            </Collapse>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Controller
                    name="currentPassword"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            fullWidth
                            label="Current Password"
                            type={showCurrentPassword ? "text" : "password"}
                            error={!!errors.currentPassword}
                            helperText={errors.currentPassword?.message}
                            disabled={isLoading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                setShowCurrentPassword(!showCurrentPassword)
                                            }
                                            edge="end"
                                        >
                                            {showCurrentPassword ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                />

                <Controller
                    name="newPassword"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            fullWidth
                            label="New Password"
                            type={showNewPassword ? "text" : "password"}
                            error={!!errors.newPassword}
                            helperText={
                                errors.newPassword?.message ||
                                "8-32 characters, alphanumeric and @ only"
                            }
                            disabled={isLoading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                setShowNewPassword(!showNewPassword)
                                            }
                                            edge="end"
                                        >
                                            {showNewPassword ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                />

                <Controller
                    name="confirmNewPassword"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            fullWidth
                            label="Confirm New Password"
                            type={showConfirmPassword ? "text" : "password"}
                            error={!!errors.confirmNewPassword}
                            helperText={errors.confirmNewPassword?.message}
                            disabled={isLoading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                setShowConfirmPassword(!showConfirmPassword)
                                            }
                                            edge="end"
                                        >
                                            {showConfirmPassword ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                />
            </Box>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                    startIcon={
                        isLoading ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <LockIcon />
                        )
                    }
                >
                    Change Password
                </Button>
            </Box>
        </Box>
    );
};

export default PasswordChangeForm;
