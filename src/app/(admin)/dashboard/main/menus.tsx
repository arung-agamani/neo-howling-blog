import Article from "@mui/icons-material/Article";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import Delete from "@mui/icons-material/Delete";
import Drafts from "@mui/icons-material/Drafts";
import FolderIcon from "@mui/icons-material/Folder";
import PermMedia from "@mui/icons-material/PermMedia";
import PersonIcon from "@mui/icons-material/Person";
import PostAdd from "@mui/icons-material/PostAdd";
import SettingsIcon from "@mui/icons-material/Settings";
import Tag from "@mui/icons-material/Tag";
import { adminRole, editorRole, guestRole, Role } from "./roles";

export type TMenuItem = {
    name: string;
    children: TMenuItem[];
    link?: string;
    icon?: any;
    role: Role;
};

export const hierarchy: TMenuItem[] = [
    {
        name: "posts",
        children: [
            {
                name: "create",
                children: [],
                link: "edit",
                icon: <PostAdd />,
                role: editorRole,
            },
            {
                name: "draft",
                children: [],
                link: "draft",
                icon: <Drafts />,
                role: editorRole,
            },
            {
                name: "trash",
                children: [],
                link: "trash",
                icon: <Delete />,
                role: editorRole,
            },
        ],
        icon: <Article />,
        role: editorRole,
    },
    {
        name: "tags",
        children: [],
        link: "tags",
        icon: <Tag />,
        role: guestRole,
    },
    {
        name: "snippets",
        children: [],
        link: "snippets",
        icon: <Tag />,
        role: editorRole
    },
    {
        name: "assets",
        children: [
            {
                name: "Browser",
                children: [],
                link: "browser",
                icon: <FolderIcon />,
                role: editorRole,
            },
            {
                name: "OG Image",
                children: [],
                link: "ogimage",
                icon: <FolderIcon />,
                role: editorRole,
            },
        ],
        icon: <PermMedia />,
        role: editorRole,
    },
    // {
    //     name: "test",
    //     children: [],
    //     icon: <Tag />,
    // },
    {
        name: "management",
        link: "management",
        role: adminRole,
        children: [
            {
                name: "parameters",
                link: "config",
                icon: <CheckBoxIcon />,
                children: [],
                role: adminRole,
            },
            {
                name: "users",
                link: "users",
                icon: <PersonIcon />,
                children: [],
                role: adminRole,
            },
        ],
        icon: <SettingsIcon />,
    },
];
