"use client";
import axios from "@/utils/axios";
import {
    Breadcrumbs,
    Divider,
    Link,
    TextField,
    Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import FolderIcon from "@mui/icons-material/FolderOpen";
import FileIcon from "@mui/icons-material/InsertDriveFile";

const RenderBreadcrumbs: React.FC<{
    arr: string[];
    idx: number;
    setLocation: any;
}> = ({ arr, idx, setLocation }) => {
    if (idx === arr.length || !arr[idx]) return null;
    return (
        <>
            <span>/</span>
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
    const [loading, setLoading] = useState(true);
    const [objects, setObjects] = useState([]);

    const fetchObjects = async (prefix = "") => {
        try {
            setLoading(true);
            const res = await axios.get("/api/dashboardv2/assets/list", {
                params: {
                    prefix: !(prefix === "" || prefix === "/")
                        ? prefix
                        : undefined,
                },
            });
            setObjects(res.data);
            setSelectedId("");
        } catch (error) {
            toast.error(
                `Error when fetching object list with prefix: ${prefix}`
            );
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchObjects(currentLocation);
    }, [currentLocation]);

    useEffect(() => {
        fetchObjects();
    }, []);
    return (
        <div className="m-4 p-4 rounded-lg bg-white flex flex-col">
            <TextField
                label="Search for files or folders here"
                placeholder="Type here to search for files or folders"
                variant="outlined"
                className="max-w-lg mb"
                sx={{
                    marginBottom: "1rem",
                    marginTop: "1rem",
                }}
            />
            <Typography variant="h3">Assets Browser</Typography>
            <Divider />
            <div className="gap-4 flex pt-4 pl-8 text-xl">
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
            {!loading && (
                <div className="grid grid-cols-4 gap-4 my-4">
                    {objects.map((obj: any) => (
                        <div
                            key={obj.id}
                            className={`px-2 py-4 rounded-lg border flex gap-2 ${
                                selectedId === obj.id ? "bg-slate-100" : ""
                            } hover:cursor-pointer hover:bg-slate-200 transition-colors duration-75`}
                            onClickCapture={() => {
                                setSelectedId(obj.id);
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
            )}
        </div>
    );
};

export default AssetsBrowserPage;
