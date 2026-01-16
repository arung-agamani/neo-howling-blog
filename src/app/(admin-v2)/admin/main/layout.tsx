import { Metadata } from "next";
import Sidebar from "@/components/admin/Sidebar";
import QueryProvider from "@/lib/react-query/QueryProvider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
    title: "Dashboard | Howling Admin",
    description:
        "Admin dashboard overview - view statistics, recent posts, popular tags, and quick actions for managing your blog",
};

export default async function MainAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <QueryProvider>
            <div className="flex flex-col md:flex-row min-h-screen w-full bg-muted">
                {/* Sidebar at top on mobile, left on desktop */}
                <Sidebar />
                <div className="flex-1 flex flex-col min-h-0">
                    <main className="flex-1 overflow-auto">{children}</main>
                </div>
            </div>
            <Toaster />
        </QueryProvider>
    );
}
