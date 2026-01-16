import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Posts Management | Howling Admin",
    description:
        "Manage all your blog posts and content - create, edit, and publish posts with advanced filtering and search",
};

export default function PostsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
