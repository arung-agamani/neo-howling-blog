import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Settings | Howling Admin",
    description:
        "Manage application settings and configuration - control system preferences, security, and general settings",
};

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
