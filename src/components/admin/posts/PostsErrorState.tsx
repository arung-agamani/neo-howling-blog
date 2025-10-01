import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface PostsErrorStateProps {
    error: string;
}

export default function PostsErrorState({ error }: PostsErrorStateProps) {
    return (
        <div className="flex-1 p-6">
            <h1 className="text-2xl font-bold mb-4">Posts Management</h1>
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-red-800">
                                Failed to load posts
                            </h3>
                            <p className="text-red-600 mt-1">{error}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Please try refreshing the page or contact support if the problem persists.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
