import { Post, PaginationMetadata } from "@/app/(user)/APIContract";
import { atom } from "jotai";

export interface PostsState {
    posts: Post[];
    pagination: PaginationMetadata | null;
    isLoading: boolean;
    isLoadingMore: boolean;
    error: boolean;
}

const initialState: PostsState = {
    posts: [],
    pagination: null,
    isLoading: false,
    isLoadingMore: false,
    error: false,
};

export const PostsStateAtom = atom<PostsState>(initialState);

// Legacy atom for backward compatibility
export const APIResultPostsAtom = atom(
    (get): [Post[], boolean] => {
        const state = get(PostsStateAtom);
        return [state.posts, state.error];
    },
    (get, set, value: [Post[], boolean]) => {
        set(PostsStateAtom, {
            ...get(PostsStateAtom),
            posts: value[0],
            error: value[1],
        });
    },
);
