export interface Post {
    id: string;
    title: string;
    link: string;
    author?: string;
    datePosted: string;
    updatedAt?: string;
    description?: string;
    tags: string[];
    bannerUrl?: string;
    isPublished: boolean;
    deleted?: boolean;
}

export type FilterStatus = "all" | "published" | "draft";

export interface PostsPageProps {
    posts: Post[];
    loading: boolean;
    error: string | null;
    searchTerm: string;
    filterStatus: FilterStatus;
    onSearchChange: (term: string) => void;
    onFilterChange: (status: FilterStatus) => void;
}

export interface PostsStatsProps {
    posts: Post[];
}

export interface PostsTableProps {
    posts: Post[];
    searchTerm: string;
    filterStatus: FilterStatus;
}

export interface PostCardProps {
    post: Post;
}

export interface PostsFiltersProps {
    searchTerm: string;
    filterStatus: FilterStatus;
    onSearchChange: (term: string) => void;
    onFilterChange: (status: FilterStatus) => void;
}
