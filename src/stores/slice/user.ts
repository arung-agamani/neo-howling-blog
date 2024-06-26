import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { z } from "zod";
import { RootState } from "..";

enum Roles {
    ADMIN,
    EDITOR,
    VIEWER,
}
const User = z.object({
    username: z.string(),
    role: z.nativeEnum(Roles),
    name: z.string(),
    birthday: z.coerce.date(),
});

type User = z.infer<typeof User>;

const userInitialState: User = {
    username: "test",
    role: Roles.VIEWER,
    name: "",
    birthday: new Date(),
};

export const userSlice = createSlice({
    name: "user",
    initialState: userInitialState,
    reducers: {
        setUser: (state, { payload }: PayloadAction<User>) => {
            state.username = payload.username;
            state.role = payload.role;
            state.name = payload.name;
            state.birthday = payload.birthday;
        },
    },
});

export const { setUser } = userSlice.actions;
export const UserState = (state: RootState) => state.user;
export const userReducer = userSlice.reducer;
