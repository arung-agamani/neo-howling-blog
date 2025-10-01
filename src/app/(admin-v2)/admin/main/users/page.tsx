"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import Link from "next/link";

import { FilterRole } from "@/components/admin/users/types";
import UsersStats from "@/components/admin/users/UsersStats";
import UsersFilters from "@/components/admin/users/UsersFilters";
import UsersTable from "@/components/admin/users/UsersTable";
import UsersLoadingState from "@/components/admin/users/UsersLoadingState";
import UsersErrorState from "@/components/admin/users/UsersErrorState";
import { useUsers } from "@/hooks/api/useUsers";

export default function UsersPage() {
    const { data: users = [], isLoading: loading, error } = useUsers();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState<FilterRole>("all");

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
    };

    const handleFilterChange = (role: FilterRole) => {
        setFilterRole(role);
    };

    if (loading) {
        return <UsersLoadingState />;
    }

    if (error) {
        return (
            <UsersErrorState
                error={
                    error instanceof Error
                        ? error.message
                        : "Failed to load users"
                }
            />
        );
    }

    return (
        <div className="flex-1 p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Users Management</h1>
                    <p className="text-muted-foreground">
                        Manage user accounts and permissions
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/main/users/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New User
                    </Link>
                </Button>
            </div>

            {/* Statistics */}
            <UsersStats users={users} />

            {/* Filters and Search */}
            <UsersFilters
                searchTerm={searchTerm}
                filterRole={filterRole}
                onSearchChange={handleSearchChange}
                onFilterChange={handleFilterChange}
            />

            {/* Users Table */}
            <UsersTable
                users={users}
                searchTerm={searchTerm}
                filterRole={filterRole}
            />
        </div>
    );
}
