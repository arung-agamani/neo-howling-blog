import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Users Management | Howling Admin",
    description:
        "Manage user accounts and permissions - view, create, and edit user profiles and roles",
};

export default function UsersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
