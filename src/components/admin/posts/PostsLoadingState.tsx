import React from "react";

export default function PostsLoadingState() {
    return (
        <div className="flex-1 p-6">
            <div className="animate-pulse">
                {/* Header skeleton */}
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>

                {/* Stats cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-200 rounded"></div>
                    ))}
                </div>

                {/* Filters skeleton */}
                <div className="h-16 bg-gray-200 rounded mb-6"></div>

                {/* Posts table skeleton */}
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
