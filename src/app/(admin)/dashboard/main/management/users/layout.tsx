import useRoleAuth from "@/hooks/useRoleAuth";

export const metadata = {
    title: "Users Management - Dashboard",
};

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    await useRoleAuth(["admin"]);
    return <>{children}</>;
}
