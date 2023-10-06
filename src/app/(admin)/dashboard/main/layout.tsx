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
import axios from "@/utils/axios";
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

import Home from "@mui/icons-material/Home";
import Article from "@mui/icons-material/Article";
import PostAdd from "@mui/icons-material/PostAdd";
import Drafts from "@mui/icons-material/Drafts";
import Delete from "@mui/icons-material/Delete";
import Tag from "@mui/icons-material/Tag";
import PermMedia from "@mui/icons-material/PermMedia";
import MenuIcon from "@mui/icons-material/Menu";
import UserIcon from "@mui/icons-material/AccountBox";

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
import zIndex from "@mui/material/styles/zIndex";

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
        children: [],
        icon: <PermMedia />,
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

const DRAWER_WIDTH = 320;

export default function PostLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [auth, setAuth] = useState(false);
    const [open, isOpen] = useState(true);
    const router = useRouter();
    // const pathname = usePathname();
    useEffect(() => {
        axios
            .get("/api/dashboard")
            .then(() => {
                setAuth(true);
            })
            .catch((err) => {
                router.push("/dashboard");
                // alert(err.response.data.message);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {}, [children, router]);

    const signout = () => {
        axios
            .get("/api/signout")
            .then(() => {
                // toast.info("Signing out...");
                window.location.assign("/");
            })
            .catch(() => {
                toast.error("Failed signing out");
            });
    };
    if (!auth) return null;
    return (
        <>
            <AppBar
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backgroundColor: "#0B132B",
                }}
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
                    <Box sx={{ flexGrow: 0 }}>
                        <Avatar />
                    </Box>
                </Toolbar>
            </AppBar>
            <Toolbar />
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

                        <Link href={"/dashboard/profile"}>
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
