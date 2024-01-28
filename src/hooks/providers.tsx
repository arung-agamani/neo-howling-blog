"use client";

import { useState } from "react";
import {
    QueryClient,
    QueryClientProvider,
    HydrationBoundary,
} from "@tanstack/react-query";

export default function QueryProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <HydrationBoundary>{children}</HydrationBoundary>
        </QueryClientProvider>
    );
}
