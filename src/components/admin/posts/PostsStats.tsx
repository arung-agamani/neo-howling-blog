import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Edit, Send, Trash2 } from "lucide-react";
import { PostsStatsProps } from "./types";

export default function PostsStats({ counts, isLoading }: PostsStatsProps) {
    const cards = [
        {
            label: "Total Posts",
            value: counts.all,
            icon: Eye,
            tone: "bg-blue-100 text-blue-600",
        },
        {
            label: "Published",
            value: counts.published,
            icon: Send,
            tone: "bg-green-100 text-green-600",
        },
        {
            label: "Drafts",
            value: counts.draft,
            icon: Edit,
            tone: "bg-yellow-100 text-yellow-600",
        },
        {
            label: "In Trash",
            value: counts.trash,
            icon: Trash2,
            tone: "bg-red-100 text-red-600",
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map(({ label, value, icon: Icon, tone }) => (
                <Card key={label}>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <div className={`rounded-lg p-2 ${tone}`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{label}</p>
                                <p className="text-2xl font-bold tabular-nums">
                                    {isLoading ? "—" : value}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
