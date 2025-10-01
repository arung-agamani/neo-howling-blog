import { Post, FilterStatus } from "./types";

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

export const filterPosts = (
    posts: Post[],
    searchTerm: string,
    filterStatus: FilterStatus
): Post[] => {
    return posts.filter((post) => {
        if (post.deleted) return false;

        const matchesSearch =
            post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.description
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            post.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.tags?.some((tag) =>
                tag.toLowerCase().includes(searchTerm.toLowerCase())
            );

        const matchesFilter =
            filterStatus === "all" ||
            (filterStatus === "published" && post.isPublished) ||
            (filterStatus === "draft" && !post.isPublished);

        return matchesSearch && matchesFilter;
    });
};

export const calculatePostStats = (posts: Post[]) => {
    const activePosts = posts.filter((p) => !p.deleted);
    const publishedPosts = activePosts.filter((p) => p.isPublished);
    const draftPosts = activePosts.filter((p) => !p.isPublished);
    const totalTags = new Set(posts.flatMap((p) => p.tags || [])).size;

    return {
        total: activePosts.length,
        published: publishedPosts.length,
        drafts: draftPosts.length,
        totalTags,
    };
};

export const getAuthorDisplayName = (author?: string): string => {
    return author || "Unknown Author";
};

export const getDescriptionDisplayText = (description?: string): string => {
    return description || "No description available";
};

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
};
