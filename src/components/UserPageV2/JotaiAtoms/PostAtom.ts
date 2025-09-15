import { Post } from "@/app/(userv2)/v2/APIContract";
import { atom } from "jotai";

export const APIResultPostsAtom = atom<[Post[], boolean]>([[], false]);
