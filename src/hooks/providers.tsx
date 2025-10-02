"use client";

import { useState } from "react";
import {
    QueryClient,
    QueryClientProvider,
    HydrationBoundary,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function QueryProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    const [queryClient] = useState(() => new QueryClient());
    queryClient.setDefaultOptions({
        queries: {
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    });
    return (
        <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={undefined}>{children}</HydrationBoundary>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
