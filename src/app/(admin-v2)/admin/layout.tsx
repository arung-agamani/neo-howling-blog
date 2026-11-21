"use client";

import { SessionProvider } from "next-auth/react";
import ThemeColorProvider from "@/components/theme/ThemeColorProvider";
import "react-toastify/dist/ReactToastify.css";
import "../../(user)/globals.css";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html>
            <head></head>
            <body>
                <SessionProvider>
                    <ThemeColorProvider />
                    {children}
                </SessionProvider>
            </body>
        </html>
    );
}
