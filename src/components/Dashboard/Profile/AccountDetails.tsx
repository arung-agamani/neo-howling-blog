import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EditIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";

interface AccountDetailsProps {
    username: string;
    email?: string;
    role: string;
    dateCreated?: Date;
    lastAccess?: Date;
}

const AccountDetails: React.FC<AccountDetailsProps> = ({
    username,
    email,
    role,
    dateCreated,
    lastAccess,
}) => {
    const formatDate = (date?: Date) => {
        if (!date) return "Unknown";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDateShort = (date?: Date) => {
        if (!date) return "Unknown";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getRoleIcon = (role: string) => {
        switch (role.toLowerCase()) {
            case "admin":
                return <AdminPanelSettingsIcon fontSize="small" />;
            case "editor":
                return <EditIcon fontSize="small" />;
            case "user":
                return <PersonIcon fontSize="small" />;
            default:
                return <GroupIcon fontSize="small" />;
        }
    };

    const getRoleColor = (
        role: string
    ): "error" | "warning" | "info" | "default" => {
        switch (role.toLowerCase()) {
            case "admin":
                return "error";
            case "editor":
                return "warning";
            case "user":
                return "info";
            default:
                return "default";
        }
    };

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
                            Username
                        </Box>
                        <Box
                            component="span"
                            sx={{
                                fontWeight: 600,
                                fontSize: "1.1rem",
                                fontFamily: "monospace",
                            }}
                        >
                            @{username}
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
                            Email
                        </Box>
                        <Box
                            component="span"
                            sx={{ fontWeight: 500, fontSize: "1rem" }}
                        >
                            {email || "Not set"}
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
                            Role
                        </Box>
                        <Chip
                            icon={getRoleIcon(role)}
                            label={role.charAt(0).toUpperCase() + role.slice(1)}
                            color={getRoleColor(role)}
                            size="small"
                            sx={{ fontWeight: 500 }}
                        />
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
                            Member Since
                        </Box>
                        <Box
                            component="span"
                            sx={{ fontWeight: 500, fontSize: "1rem" }}
                        >
                            {formatDateShort(dateCreated)}
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={12}>
                    <Box
                        sx={{
                            p: 2,
                            bgcolor: "grey.50",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "grey.200",
                        }}
                    >
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                        >
                            Last Activity
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                            {formatDate(lastAccess)}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            <Box
                sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: "info.50",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "info.200",
                }}
            >
                <Typography variant="body2" color="info.dark">
                    <strong>Note:</strong> Username and role can only be changed
                    by an administrator. Contact support if you need to update
                    these fields.
                </Typography>
            </Box>
        </Box>
    );
};

export default AccountDetails;
