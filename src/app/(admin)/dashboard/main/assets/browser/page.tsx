"use client";
import axios from "@/utils/axios";
import { Divider, Toolbar, Typography } from "@mui/material";
import React, { useState } from "react";
import FolderIcon from "@mui/icons-material/FolderOpen";
import FileIcon from "@mui/icons-material/InsertDriveFile";
import Drawer from "@mui/material/Drawer";
import CircularProgress from "@mui/material/CircularProgress";
import { useQuery } from "@tanstack/react-query";
import mime from "mime-types";

interface ListingItem {
    id: string;
    name: string;
    modDate?: string;
    size?: number;
    isDir?: boolean;
}

const RenderBreadcrumbs: React.FC<{
    arr: string[];
    idx: number;
    setLocation: any;
}> = ({ arr, idx, setLocation }) => {
    if (idx === arr.length || !arr[idx]) return null;
    return (
        <>
            <span>&gt;</span>
            <div
                className=" text-blue-500 hover:text-blue-400 hover:cursor-pointer"
                onClick={() =>
                    setLocation(
                        arr
                            .slice(0, idx + 1)
                            .join("/")
                            .concat("/")
                    )
                }
            >
                {arr[idx]}
            </div>
            <RenderBreadcrumbs
                arr={arr}
                idx={idx + 1}
                setLocation={setLocation}
            />
        </>
    );
};

const AssetsBrowserPage = () => {
    const [currentLocation, setCurrentLocation] = useState("");
    const [selectedId, setSelectedId] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { data: objects, isSuccess } = useQuery({
        queryKey: ["s3DirData", currentLocation],
        queryFn: async () => {
            const res = await axios.get("/api/dashboardv2/assets/list", {
                params: {
                    prefix: !(currentLocation === "" || currentLocation === "/")
                        ? currentLocation
                        : undefined,
                },
            });
            return res.data as ListingItem[];
        },
        staleTime: 60000,
    });

    const DetailPaneData = () => {
        const item = objects && objects.find((x) => x.id === selectedId);
        if (!item) return null;
        return (
            <React.Fragment>
                <p className="font-semibold text-blue-900">Date Modified:</p>
                <p className="break-words col-span-3">
                    {new Date(item.modDate!).toLocaleString()}
                </p>
                <p className="font-semibold text-blue-900">Absolute Path:</p>
                <p className="break-words col-span-3">{item.id}</p>
                <p className="font-semibold text-blue-900">MIME Type:</p>
                <p className="break-words col-span-3">
                    {mime.lookup(item.name || "")}
                </p>
                <p className="font-semibold text-blue-900">Link:</p>
                <a
                    className="break-words col-span-3 hyperlink"
                    href={`https://howling-blog-uploads.s3.ap-southeast-1.amazonaws.com/${item.id}`}
                    target="_blank"
                >
                    {`https://howling-blog-uploads.s3.ap-southeast-1.amazonaws.com/${item.id}`}
                </a>
            </React.Fragment>
        );
    };

    return (
        <div className="m-4 p-4 rounded-lg bg-white flex flex-col">
            <Drawer
                anchor="right"
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                sx={{
                    width: 500,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: 500,
                        boxSizing: "border-box",
                    },
                }}
            >
                <Toolbar />
                {isSuccess && (
                    <div className="p-4">
                        <p className="break-words text-2xl">
                            {
                                objects.find((x: any) => x.id === selectedId)
                                    ?.name
                            }
                        </p>
                        <hr />
                        <img
                            src={`https://howling-blog-uploads.s3.ap-southeast-1.amazonaws.com/${
                                objects.find((x: any) => x.id === selectedId)
                                    ?.id
                            }`}
                            className="py-2"
                        />
                        <div className="grid grid-cols-4">
                            <DetailPaneData />
                        </div>
                    </div>
                )}
            </Drawer>
            <Typography variant="h3">Assets Browser</Typography>
            <Divider />
            <div className="gap-2 flex pt-4 text-xl">
                <div
                    className=" text-blue-500 hover:text-blue-400 hover:cursor-pointer"
                    onClick={() => setCurrentLocation("")}
                >
                    Home
                </div>
                {
                    <RenderBreadcrumbs
                        arr={currentLocation.split("/")}
                        idx={0}
                        setLocation={setCurrentLocation}
                    />
                }
            </div>
            {isSuccess ? (
                <div className="grid grid-cols-4 gap-4 my-4">
                    {isSuccess &&
                        objects.map((obj: any) => (
                            <div
                                key={obj.id}
                                className={`px-2 py-4 rounded-lg border flex gap-2 ${
                                    selectedId === obj.id ? "bg-slate-100" : ""
                                } hover:cursor-pointer hover:bg-slate-200 transition-colors duration-75`}
                                onClickCapture={() => {
                                    setSelectedId(obj.id);
                                    if (!obj.isDir) {
                                        setSidebarOpen(true);
                                    }
                                }}
                                onDoubleClickCapture={() => {
                                    if (obj.isDir) setCurrentLocation(obj.id);
                                    else
                                        window
                                            .open(
                                                `https://howling-blog-uploads.s3.ap-southeast-1.amazonaws.com/${obj.id}`,
                                                "_blank"
                                            )
                                            ?.focus();
                                }}
                            >
                                {obj.isDir ? <FolderIcon /> : <FileIcon />}
                                <Typography variant="body1" noWrap>
                                    {obj.name}
                                </Typography>
                            </div>
                        ))}
                </div>
            ) : (
                <div className="flex justify-center align-middle py-8">
                    <CircularProgress />
                </div>
            )}
        </div>
    );
};

export default AssetsBrowserPage;
