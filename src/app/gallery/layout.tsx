import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Howling Gallery",
    description: "Source of banner images used across the Howling Blog website.",
    openGraph: {
        title: "Howling Gallery",
        description: "Source of banner images used across the Howling Blog website.",
        type: "website",
    },
    icons: {
        icon: "/favicon.png",
    },
};

export default function GalleryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>{children}</body>
        </html>
    );
}
