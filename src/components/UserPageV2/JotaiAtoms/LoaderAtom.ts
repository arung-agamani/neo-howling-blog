import { atom } from "jotai";

export const LoaderAtom = atom<boolean>(false);

export const IsTransitioningAtom = atom<boolean>(false);
export const IsReadyAtom = atom<boolean>(false);
