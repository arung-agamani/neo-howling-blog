import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Editor Behavior Test | Howling Admin",
    description:
        "Test and debug editor behavior and functionality - development and testing environment for the content editor",
};

export default function EditorTestLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
