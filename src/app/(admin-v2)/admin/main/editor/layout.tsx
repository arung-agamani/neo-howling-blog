import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Content Editor | Howling Admin",
    description:
        "Create and edit blog posts and code snippets with a rich text editor - featuring real-time preview, word count, and publishing controls",
};

export default function EditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
