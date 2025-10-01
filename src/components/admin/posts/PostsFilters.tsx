import React from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { PostsFiltersProps } from "./types";

export default function PostsFilters({
    searchTerm,
    filterStatus,
    onSearchChange,
    onFilterChange,
}: PostsFiltersProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search posts by title, description, author, or tags..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={filterStatus === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => onFilterChange("all")}
                        >
                            All Posts
                        </Button>
                        <Button
                            variant={filterStatus === "published" ? "default" : "outline"}
                            size="sm"
                            onClick={() => onFilterChange("published")}
                        >
                            Published
                        </Button>
                        <Button
                            variant={filterStatus === "draft" ? "default" : "outline"}
                            size="sm"
                            onClick={() => onFilterChange("draft")}
                        >
                            Drafts
                        </Button>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}
