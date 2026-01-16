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

export interface ApiV1Response<T = unknown> {
    success: boolean;
    errors: string[];
    data: T;
}
