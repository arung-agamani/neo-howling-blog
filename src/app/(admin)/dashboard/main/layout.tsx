/* eslint-disable @next/next/no-html-link-for-pages */
"use client";
import React, {
    useEffect,
    useState,
    Suspense,
    // PropsWithChildren,
    // useContext,
    // useRef,
} from "react";
import { useRouter /* , usePathname */ } from "next/navigation";
import Link from "next/link";

import { toast } from "react-toastify";
// import { motion, AnimatePresence } from "framer-motion";
// import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context";
// import { Paper } from "@mui/material";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";

import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import Home from "@mui/icons-material/Home";
import Article from "@mui/icons-material/Article";
import PostAdd from "@mui/icons-material/PostAdd";
import Drafts from "@mui/icons-material/Drafts";
import Delete from "@mui/icons-material/Delete";
import Tag from "@mui/icons-material/Tag";
import PermMedia from "@mui/icons-material/PermMedia";
import MenuIcon from "@mui/icons-material/Menu";
import UserIcon from "@mui/icons-material/AccountBox";
import LogoutIcon from "@mui/icons-material/Logout";
import FeedbackIcon from "@mui/icons-material/Feedback";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import FolderIcon from "@mui/icons-material/Folder";

// function FrozenRouter(props: PropsWithChildren<{}>) {
//     const context = useContext(LayoutRouterContext);
//     const frozen = useRef(context).current;

//     return (
//         <LayoutRouterContext.Provider value={frozen}>
//             {props.children}
//         </LayoutRouterContext.Provider>
//     );
// }

import Loading from "./loading";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { setUser, UserState } from "@/stores/slice/user";
import { AxiosError } from "axios";
import { useSession, signOut as nextSignout } from "next-auth/react";
import axios from "@/utils/axios";
import { Metadata } from "next";

type MenuItem = {
    name: string;
    children: MenuItem[];
    link?: string;
    icon?: any;
};

const hierarchy: MenuItem[] = [
    {
        name: "posts",
        children: [
            {
                name: "create",
                children: [],
                link: "edit",
                icon: <PostAdd />,
            },
            {
                name: "draft",
                children: [],
                link: "draft",
                icon: <Drafts />,
            },
            {
                name: "trash",
                children: [],
                link: "trash",
                icon: <Delete />,
            },
        ],
        icon: <Article />,
    },
    {
        name: "tags",
        children: [],
        link: "tags",
        icon: <Tag />,
    },
    {
        name: "assets",
        children: [
            {
                name: "Browser",
                children: [],
                link: "browser",
                icon: <FolderIcon />,
            },
        ],
        icon: <PermMedia />,
    },
    {
        name: "test",
        children: [],
        icon: <Tag />,
    },
    // {
    //     name: "config",
    //     children: [
    //         {
    //             name: "user",
    //             children: [
    //                 {
    //                     name: "profile",
    //                     children: [],
    //                 },
    //             ],
    //         },
    //         {
    //             name: "global",
    //             children: [
    //                 {
    //                     name: "profile",
    //                     children: [],
    //                 },
    //             ],
    //         },
    //     ],
    // },
];

const TreeView: React.FC<{
    data: MenuItem;
    parentLink: string;
    depth: number;
}> = ({ data, parentLink, depth }) => {
    const [open, setOpen] = useState(true);
    const handleClick = () => {
        setOpen(!open);
    };
    return (
        <React.Fragment
            key={`${parentLink}/${data.link ? data.link : data.name}`}
        >
            <Link href={`${parentLink}/${data.link ? data.link : data.name}`}>
                {/* <div
                    className={`mx-2 rounded-xl py-1 px-4 text-slate-800 font-bold ${
                        depth % 2 != 0 ? "bg-slate-50" : "bg-slate-400"
                    }`}
                >
                    <span>{data.name}</span>
                </div> */}
                <ListItem disablePadding>
                    <ListItemButton
                        sx={{
                            "& .MuiListItemIcon-root": {
                                color: "#947EB0",
                            },
                        }}
                    >
                        {data.icon && <ListItemIcon>{data.icon}</ListItemIcon>}
                        <ListItemText className="capitalize">
                            {data.name}
                        </ListItemText>
                    </ListItemButton>
                </ListItem>
            </Link>
            {data.children && (
                <Collapse in={open} unmountOnExit timeout="auto">
                    {data.children.map((child, index) => (
                        <div
                            className="ml-4 mt-2"
                            key={`${parentLink}/${
                                data.link ? data.link : data.name
                            }/${child.link ? child.link : child.name}`}
                        >
                            <TreeView
                                data={child}
                                parentLink={`${parentLink}/${
                                    data.link ? data.link : data.name
                                }`}
                                depth={depth + 1}
                            />
                        </div>
                    ))}
                </Collapse>
            )}
        </React.Fragment>
    );
};

const DRAWER_WIDTH = 240;

export default function PostLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [open, isOpen] = useState(true);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openProfileMenu = Boolean(anchorEl);
    const dispatch = useAppDispatch();
    const user = useAppSelector(UserState);
    const router = useRouter();
    const { data: session, status } = useSession();
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/dashboard");
        } else if (status === "authenticated") {
            axios.get("/api/hellov2", { withCredentials: true }).then((res) => {
                const user = res.data.user;
                dispatch(setUser(user));
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const signout = async () => {
        await nextSignout({ redirect: false });
        router.push("/dashboard");
    };

    if (status === "loading") return null;
    if (status === "unauthenticated") return null;
    return (
        <>
            <AppBar
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: "#0B132B",
                }}
                position="fixed"
            >
                <Toolbar>
                    <IconButton
                        sx={{ mr: 2 }}
                        onClick={() => {
                            isOpen(!open);
                        }}
                    >
                        <MenuIcon color="secondary" />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography
                            variant="h6"
                            component={"div"}
                            color={"white"}
                        >
                            Admin Dashboard
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            flexGrow: 0,
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <Typography variant="body1">{user.username}</Typography>
                        <IconButton
                            onClick={(e: React.MouseEvent<HTMLElement>) => {
                                setAnchorEl(e.currentTarget);
                            }}
                        >
                            <Avatar sx={{ ml: 2 }} src="/test-avatar.png" />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>
            <Menu
                anchorEl={anchorEl}
                open={openProfileMenu}
                onClose={() => {
                    setAnchorEl(null);
                }}
                onClick={() => {
                    setAnchorEl(null);
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                disableScrollLock={true}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: "visible",
                        filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                        mt: 1.5,
                        "& .MuiAvatar-root": {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
                        "&:before": {
                            content: '""',
                            display: "block",
                            position: "absolute",
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: "background.paper",
                            transform: "translateY(-50%) rotate(45deg)",
                            zIndex: 0,
                        },
                    },
                }}
            >
                <MenuItem
                    onClick={() => {
                        setAnchorEl(null);
                    }}
                >
                    <AccountCircleIcon sx={{ mr: 2 }} /> Profile
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setAnchorEl(null);
                    }}
                >
                    <FeedbackIcon sx={{ mr: 2 }} /> Report Feedback
                </MenuItem>
                <Divider />
                <MenuItem
                    onClick={() => {
                        signout();
                    }}
                >
                    <LogoutIcon sx={{ mr: 2 }} /> Log Out
                </MenuItem>
            </Menu>
            {/* <Toolbar /> */}
            <div className="flex">
                <Drawer
                    variant="persistent"
                    anchor="left"
                    open={open}
                    sx={{
                        width: DRAWER_WIDTH,
                        flexShrink: 0,
                        "& .MuiDrawer-paper": {
                            width: DRAWER_WIDTH,
                            boxSizing: "border-box",
                        },
                    }}
                    PaperProps={{
                        sx: {
                            backgroundColor: "#0B132B",
                            color: "#F4FAFF",
                        },
                    }}
                >
                    <Toolbar />
                    <List>
                        <Link href={"/dashboard/main"}>
                            <ListItem disablePadding>
                                <ListItemButton
                                    sx={{
                                        "& .MuiListItemIcon-root": {
                                            color: "#947EB0",
                                        },
                                    }}
                                >
                                    <ListItemIcon>
                                        <Home />
                                    </ListItemIcon>
                                    <ListItemText>Dashboard</ListItemText>
                                </ListItemButton>
                            </ListItem>
                        </Link>

                        <Link href={"/dashboard/main/profile"}>
                            <ListItem disablePadding>
                                <ListItemButton
                                    sx={{
                                        "& .MuiListItemIcon-root": {
                                            color: "#947EB0",
                                        },
                                    }}
                                >
                                    <ListItemIcon>
                                        <UserIcon />
                                    </ListItemIcon>
                                    <ListItemText>Profile</ListItemText>
                                </ListItemButton>
                            </ListItem>
                        </Link>
                    </List>

                    <Divider />
                    <List>
                        {hierarchy.map((menu) => (
                            <div
                                className="my-4"
                                key={"/dashboard/main/" + menu.name}
                            >
                                <TreeView
                                    data={menu}
                                    parentLink={"/dashboard/main"}
                                    depth={1}
                                />
                            </div>
                        ))}
                    </List>
                    <Divider />
                    <List>
                        <Link href={"/dashboard/main/config"}>
                            <ListItem disablePadding>
                                <ListItemButton
                                    sx={{
                                        "& .MuiListItemIcon-root": {
                                            color: "#947EB0",
                                        },
                                    }}
                                >
                                    <ListItemIcon>
                                        <Home />
                                    </ListItemIcon>
                                    <ListItemText>Configurations</ListItemText>
                                </ListItemButton>
                            </ListItem>
                        </Link>
                        <Link href={"/"}>
                            <ListItem disablePadding>
                                <ListItemButton
                                    sx={{
                                        "& .MuiListItemIcon-root": {
                                            color: "#947EB0",
                                        },
                                    }}
                                >
                                    <ListItemIcon>
                                        <Home />
                                    </ListItemIcon>
                                    <ListItemText>Home Page</ListItemText>
                                </ListItemButton>
                            </ListItem>
                        </Link>
                    </List>
                </Drawer>

                <Suspense fallback={<Loading />}>
                    <Grid
                        container
                        spacing={0}
                        direction="column"
                        alignItems="center"
                        justifyContent="center"
                        sx={{
                            minHeight: "100vh",
                            backgroundColor: "white",
                            marginLeft: `-${DRAWER_WIDTH}px`,
                            transition: (theme) =>
                                theme.transitions.create("margin", {
                                    easing: theme.transitions.easing.sharp,
                                    duration:
                                        theme.transitions.duration
                                            .leavingScreen,
                                }),
                            ...(open && {
                                marginLeft: 0,
                                transition: (theme) =>
                                    theme.transitions.create("margin", {
                                        easing: theme.transitions.easing
                                            .easeOut,
                                        duration:
                                            theme.transitions.duration
                                                .enteringScreen,
                                    }),
                            }),
                        }}
                    >
                        <Box
                            sx={{
                                backgroundColor: "primary.main",
                                paddingTop: "64px",
                            }}
                            display="block"
                            width="100%"
                            minHeight="100vh"
                        >
                            {children}
                        </Box>
                    </Grid>
                </Suspense>
                {/* <AnimatePresence>
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <FrozenRouter>{children}</FrozenRouter>
                    </motion.div>
                </AnimatePresence> */}
            </div>
        </>
    );
}
