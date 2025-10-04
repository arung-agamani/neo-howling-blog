import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Edit, Tag } from "lucide-react";
import { PostsStatsProps } from "./types";
import { calculatePostStats } from "./utils";

export default function PostsStats({ posts }: PostsStatsProps) {
    const stats = calculatePostStats(posts);

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Eye className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Total Posts</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Eye className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Published</p>
                            <p className="text-2xl font-bold">{stats.published}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Edit className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Drafts</p>
                            <p className="text-2xl font-bold">{stats.drafts}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Tag className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Total Tags</p>
                            <p className="text-2xl font-bold">{stats.totalTags}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
