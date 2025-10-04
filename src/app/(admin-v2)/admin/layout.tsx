"use client";

import { SessionProvider } from "next-auth/react";
import "react-toastify/dist/ReactToastify.css";
import "../../(userv2)/v2/globals.css";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html>
            <head></head>
            <body>
                <SessionProvider>{children}</SessionProvider>
            </body>
        </html>
    );
}
