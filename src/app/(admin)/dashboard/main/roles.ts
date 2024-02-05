import { TUserRoles } from "@/types";

export type Role = {
    name: TUserRoles;
    children: Role[];
};

export const guestRole: Role = {
    name: "guest",
    children: [],
};
export const userRole: Role = {
    name: "user",
    children: [guestRole],
};
export const editorRole: Role = {
    name: "editor",
    children: [userRole],
};
export const adminRole: Role = {
    name: "admin",
    children: [guestRole, editorRole, guestRole],
};

export const roles = {
    guest: guestRole,
    user: userRole,
    editor: editorRole,
    admin: adminRole,
};
