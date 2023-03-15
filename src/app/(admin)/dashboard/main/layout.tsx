"use client";
import { useEffect, useState } from "react";
import axios from "@/utils/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type MenuItem = {
    name: string;
    children: MenuItem[];
};

const hierarchy: MenuItem[] = [
    {
        name: "posts",
        children: [
            {
                name: "create",
                children: [],
            },
        ],
    },
    {
        name: "config",
        children: [
            {
                name: "user",
                children: [
                    {
                        name: "profile",
                        children: [],
                    },
                ],
            },
            {
                name: "global",
                children: [
                    {
                        name: "profile",
                        children: [],
                    },
                ],
            },
        ],
    },
];

const TreeView: React.FC<{
    data: MenuItem;
    parentLink: string;
    depth: number;
}> = ({ data, parentLink, depth }) => {
    return (
        <>
            <Link key={data.name} href={parentLink + "/" + data.name}>
                <div
                    className={`mx-2 rounded-xl py-1 px-4 text-slate-800 font-bold ${
                        depth % 2 != 0 ? "bg-slate-50" : "bg-slate-400"
                    }`}
                >
                    <span>{data.name}</span>
                </div>
            </Link>
            {data.children && (
                <div className="ml-4 mt-2">
                    {data.children.map((child) => (
                        <TreeView
                            key={parentLink + "/" + child.name}
                            data={child}
                            parentLink={parentLink}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </>
    );
};

export default function PostLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [auth, setAuth] = useState(false);
    const router = useRouter();
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
    if (!auth) return null;
    return (
        <>
            <ToastContainer autoClose={3000} />
            <div className="flex">
                <aside className="sticky h-screen top-0 capitalize bg-gray-600 text-slate-100 w-full max-w-xs">
                    <div className="px-4 py-4 text-slate-50">
                        <Link href="/dashboard/main">
                            <p className="text-3xl font-semibold">Dashboard</p>
                        </Link>
                    </div>
                    {/* {["posts", "configs", "about"].map((menu) => (
                        <Link key={menu} href={"/dashboard/main/" + menu}>
                            <div className="my-4 mx-2 rounded-xl py-1 px-4 text-slate-800 font-bold bg-slate-50">
                                {menu}
                            </div>
                        </Link>
                    ))} */}
                    {hierarchy.map((menu) => (
                        <div className="my-4" key={menu.name}>
                            <TreeView
                                data={menu}
                                parentLink={"/dashboard/main"}
                                depth={1}
                            />
                        </div>
                    ))}
                </aside>
                <div className="bg-zinc-900 w-full text-white">{children}</div>
            </div>
        </>
    );
}
