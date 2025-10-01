import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import Sidebar from "@/components/admin/Sidebar";
import QueryProvider from "@/lib/react-query/QueryProvider";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function MainAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/admin");
    }
    return (
        <QueryProvider>
            <div className="flex flex-col md:flex-row min-h-screen w-full bg-muted">
                {/* Sidebar at top on mobile, left on desktop */}
                <Sidebar />
                <div className="flex-1 flex flex-col min-h-0">
                    <main className="flex-1 overflow-auto">{children}</main>
                </div>
            </div>
        </QueryProvider>
    );
}
