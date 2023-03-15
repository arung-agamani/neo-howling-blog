"use client";

import "./globals.css";

export default function PostLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html>
            <body className="">{children}</body>
        </html>
    );
}
