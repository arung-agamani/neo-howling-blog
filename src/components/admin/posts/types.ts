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

export type FilterStatus = "all" | "published" | "draft" | "trash";

export interface PostsCounts {
    all: number;
    published: number;
    draft: number;
    trash: number;
}

export interface PostsStatsProps {
    counts: PostsCounts;
    isLoading?: boolean;
}

export interface PostsTableProps {
    posts: Post[];
    filterStatus: FilterStatus;
    searchTerm?: string;
    /** Background refetch in progress; the current results stay visible. */
    isFetching?: boolean;
    busyPostId?: string | null;
    onTogglePublish: (post: Post) => void;
    onRequestTrash: (post: Post) => void;
    onRestore: (post: Post) => void;
    onRequestPurge: (post: Post) => void;
}

export interface PostCardProps {
    post: Post;
    busy?: boolean;
    onTogglePublish: (post: Post) => void;
    onRequestTrash: (post: Post) => void;
    onRestore: (post: Post) => void;
    onRequestPurge: (post: Post) => void;
}

export interface PostsFiltersProps {
    searchTerm: string;
    filterStatus: FilterStatus;
    selectedTags: string[];
    onSearchChange: (term: string) => void;
    onFilterChange: (status: FilterStatus) => void;
    onTagsChange: (tags: string[]) => void;
}
