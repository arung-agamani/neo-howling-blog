import React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";

interface ProfileSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
    title,
    description,
    children,
    icon,
}) => {
    return (
        <Paper
            elevation={1}
            sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                {icon && (
                    <Box sx={{ color: "primary.main", display: "flex" }}>
                        {icon}
                    </Box>
                )}
                <Typography variant="h5" component="h2" fontWeight={600}>
                    {title}
                </Typography>
            </Box>
            {description && (
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                >
                    {description}
                </Typography>
            )}
            <Divider sx={{ mb: 3 }} />
            {children}
        </Paper>
    );
};

export default ProfileSection;
