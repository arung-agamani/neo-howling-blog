"use client";

import { SessionProvider } from "next-auth/react";
import ThemeColorProvider from "@/components/theme/ThemeColorProvider";

/**
 * Client-side providers for the v2 admin. Kept out of the layout so the
 * layout can stay a server component and export `metadata`.
 */
export default function AdminProviders({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <ThemeColorProvider />
            {children}
        </SessionProvider>
    );
}
