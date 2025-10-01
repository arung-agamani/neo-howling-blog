"use client";

import Sidebar from "@/components/admin/Sidebar";

export default function MainAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col md:flex-row min-h-screen w-full bg-muted">
            {/* Sidebar at top on mobile, left on desktop */}
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <main className="flex-1">{children}</main>
            </div>
        </div>
    );
}
