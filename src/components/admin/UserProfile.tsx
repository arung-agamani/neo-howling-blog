"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Crown, Edit, Eye, Users } from "lucide-react";
import { useCurrentUser, useLogout } from "@/hooks/api/useAuth";
import {
    capitalizeRole,
    getRoleBadgeVariant,
} from "@/components/admin/users/utils";

interface UserProfileProps {
    onLogout?: () => void;
}

export default function UserProfile({ onLogout }: UserProfileProps) {
    const { data: user, isLoading } = useCurrentUser();
    const logoutMutation = useLogout();

    const handleLogout = async () => {
        try {
            await logoutMutation.mutateAsync();
            onLogout?.();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role.toLowerCase()) {
            case "admin":
                return <Crown className="w-3 h-3" />;
            case "editor":
                return <Edit className="w-3 h-3" />;
            case "user":
                return <Eye className="w-3 h-3" />;
            case "guest":
                return <Users className="w-3 h-3" />;
            default:
                return <User className="w-3 h-3" />;
        }
    };

    const getDisplayName = (
        user: { name?: string; username?: string } | null | undefined,
    ) => {
        return user?.name || user?.username || "User";
    };

    if (isLoading) {
        return (
            <div className="p-4 border-t bg-gray-50">
                <div className="animate-pulse">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                            <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-4 border-t bg-gray-50">
                <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                        Not logged in
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-3 h-3 mr-2" />
                        Sign In
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border-t bg-gray-50/50">
            <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {getDisplayName(user).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                        {getDisplayName(user)}
                    </p>
                    <div className="flex items-center gap-1">
                        {getRoleIcon(user.role)}
                        <Badge
                            variant={getRoleBadgeVariant(user.role)}
                            className="text-xs"
                        >
                            {capitalizeRole(user.role)}
                        </Badge>
                    </div>
                </div>
            </div>

            <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
            >
                <LogOut className="w-3 h-3 mr-2" />
                {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
            </Button>
        </div>
    );
}
