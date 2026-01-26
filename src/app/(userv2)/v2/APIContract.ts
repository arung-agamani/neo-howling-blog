export interface Post {
    title: string;
    id: string;
    author: string | null;
    link: string;
    bannerUrl: string | null;
    datePosted: Date;
    description: string;
    isPublished: boolean | null;
    tags: string[];
    updatedAt: Date | null;
    deleted: boolean | null;
}

export interface RecommendedPost {
    id: string;
    title: string;
    description: string;
    bannerUrl: string | null;
    datePosted: Date;
}

export interface PaginationMetadata {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface ApiV1Response<T = unknown> {
    success: boolean;
    errors: string[];
    data: T;
}

export interface ApiV1PaginatedResponse<T = unknown> extends ApiV1Response<T> {
    pagination: PaginationMetadata;
}
