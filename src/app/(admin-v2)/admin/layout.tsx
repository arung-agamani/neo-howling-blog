import type { Metadata } from "next";
import AdminProviders from "./providers";
import "react-toastify/dist/ReactToastify.css";
import "../../(user)/globals.css";

export const metadata: Metadata = {
    // Explicit titles per route: Next resets a parent title template as soon
    // as an intermediate layout declares a plain string title, which silently
    // dropped the suffix on deeper routes.
    title: "Howling Admin",
    description: "Admin dashboard for the Howling Moon blog.",
    icons: {
        icon: [
            { url: "/favicon.png", type: "image/png" },
        ],
        shortcut: "/favicon.png",
        apple: "/favicon.png",
    },
    // Admin pages must never be indexed.
    robots: {
        index: false,
        follow: false,
    },
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <AdminProviders>{children}</AdminProviders>
            </body>
        </html>
    );
}
