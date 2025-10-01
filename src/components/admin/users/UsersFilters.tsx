import React from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { UsersFiltersProps } from "./types";

export default function UsersFilters({
    searchTerm,
    filterRole,
    onSearchChange,
    onFilterChange,
}: UsersFiltersProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search users by username, name, email, or role..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant={filterRole === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => onFilterChange("all")}
                        >
                            All Roles
                        </Button>
                        <Button
                            variant={filterRole === "admin" ? "default" : "outline"}
                            size="sm"
                            onClick={() => onFilterChange("admin")}
                        >
                            Admins
                        </Button>
                        <Button
                            variant={filterRole === "editor" ? "default" : "outline"}
                            size="sm"
                            onClick={() => onFilterChange("editor")}
                        >
                            Editors
                        </Button>
                        <Button
                            variant={filterRole === "user" ? "default" : "outline"}
                            size="sm"
                            onClick={() => onFilterChange("user")}
                        >
                            Users
                        </Button>
                        <Button
                            variant={filterRole === "guest" ? "default" : "outline"}
                            size="sm"
                            onClick={() => onFilterChange("guest")}
                        >
                            Guests
                        </Button>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}
