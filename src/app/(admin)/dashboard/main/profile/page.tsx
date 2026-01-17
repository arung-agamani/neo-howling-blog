"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Grid from "@mui/material/Grid";
import PersonIcon from "@mui/icons-material/Person";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LockIcon from "@mui/icons-material/Lock";
import BarChartIcon from "@mui/icons-material/BarChart";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
    ProfileSection,
    AvatarUpload,
    PersonalInfoForm,
    PasswordChangeForm,
    AccountDetails,
    UserStats,
    TProfileUpdate,
} from "@/components/Dashboard/Profile";
import { useCurrentUserQuery } from "@/app/(admin)/dashboard/queries";
import axios from "@/utils/axios";

export default function ProfilePage() {
    const queryClient = useQueryClient();
    const { data: user, isLoading, isSuccess } = useCurrentUserQuery();
    const handleAvatarSave = async (avatarUrl: string) => {
        if (!user) return;
        try {
            await axios.patch(`/api/v1/users/${user.id}`, { avatarUrl });
            toast.success("Avatar updated successfully");
            queryClient.invalidateQueries({ queryKey: ["user", "me"] });
        } catch (error) {
            toast.error("Failed to update avatar");
            throw error;
        }
    };

    const handlePersonalInfoSave = async (data: TProfileUpdate) => {
        if (!user) return;
        try {
            await axios.patch(`/api/v1/users/${user.id}`, data);
            toast.success("Profile updated successfully");
            queryClient.invalidateQueries({ queryKey: ["user", "me"] });
        } catch (error) {
            toast.error("Failed to update profile");
            throw error;
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
                <Skeleton
                    variant="text"
                    width={200}
                    height={60}
                    sx={{ mb: 2 }}
                />
                <Skeleton
                    variant="rectangular"
                    height={300}
                    sx={{ mb: 3, borderRadius: 2 }}
                />
                <Skeleton
                    variant="rectangular"
                    height={400}
                    sx={{ mb: 3, borderRadius: 2 }}
                />
                <Skeleton
                    variant="rectangular"
                    height={200}
                    sx={{ borderRadius: 2 }}
                />
            </Box>
        );
    }

    if (!isSuccess || !user) {
        return (
            <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="h5" color="error">
                    Failed to load profile data
                </Typography>
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                >
                    Please try refreshing the page
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                p: 3,
                maxWidth: 1200,
                mx: "auto",
                backgroundColor: "background.paper",
            }}
        >
            {/* Page Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h3" fontWeight={700} gutterBottom>
                    Profile Settings
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage your account settings and personal information
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Left Column - Avatar and Stats */}
                <Grid item xs={12} md={4}>
                    {/* Avatar Section */}
                    <ProfileSection
                        title="Profile Picture"
                        description="Upload a profile picture to personalize your account"
                    >
                        <AvatarUpload
                            currentAvatarUrl={user.avatarUrl ?? ""}
                            username={user.name || user.username}
                            onSave={handleAvatarSave}
                        />
                    </ProfileSection>

                    {/* Activity Stats */}
                    <ProfileSection
                        title="Activity Overview"
                        description="Your content contribution statistics"
                        icon={<BarChartIcon />}
                    >
                        <UserStats userId={user.id} />
                    </ProfileSection>
                </Grid>

                {/* Right Column - Main Content */}
                <Grid item xs={12} md={8}>
                    {/* Account Details Section */}
                    <ProfileSection
                        title="Account Details"
                        description="Your account information and access details"
                        icon={<AccountCircleIcon />}
                    >
                        <AccountDetails
                            username={user.username}
                            email={user.email}
                            role={user.role}
                            dateCreated={user.dateCreated}
                            lastAccess={user.lastAccess}
                        />
                    </ProfileSection>

                    {/* Personal Information Section */}
                    <ProfileSection
                        title="Personal Information"
                        description="Update your personal details"
                        icon={<PersonIcon />}
                    >
                        <PersonalInfoForm
                            initialData={{
                                name: user.name,
                                birthday: user.birthday,
                                gender: user.gender,
                                phone: user.phone,
                                bio: user.bio ? user.bio : "",
                            }}
                            onSave={handlePersonalInfoSave}
                        />
                    </ProfileSection>

                    {/* Security Section */}
                    <ProfileSection
                        title="Security"
                        description="Change your password to keep your account secure"
                        icon={<LockIcon />}
                    >
                        <PasswordChangeForm />
                    </ProfileSection>
                </Grid>
            </Grid>
        </Box>
    );
}
