"use client";
import axios from "@/utils/axios";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    IconButton,
    TextField,
    Toolbar,
    Typography,
} from "@mui/material";
import React, { useCallback, useState } from "react";
import FolderIcon from "@mui/icons-material/FolderOpen";
import FileIcon from "@mui/icons-material/InsertDriveFile";
import Drawer from "@mui/material/Drawer";
import CircularProgress from "@mui/material/CircularProgress";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import mime from "mime-types";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import {
    ServerCreateDirectory,
    ServerDeleteAsset,
    ServerUpload,
} from "@/lib/Assets";
import { useSearchParams } from "next/navigation";

import DeleteIcon from "@mui/icons-material/Delete";
import RenameIcon from "@mui/icons-material/DriveFileRenameOutline";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    TGeneratePUTSignedURLParams,
    TGeneratePUTSignedURLResponse,
} from "@/types";
import { AxiosResponse } from "axios";

// TODO: implement renaming
// FIXME: browser history state not keeping track relative directory
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
    const searchParams = useSearchParams()!;
    const queryClient = useQueryClient();
    const cd = searchParams?.get("cd");
    const [currentLocation, setCurrentLocation] = useState(
        (Array.isArray(cd) ? cd[0] : cd) || ""
    );
    const [selectedId, setSelectedId] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // New Folder Dialog
    const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
    const handleNewFolderDialogClose = () => {
        setNewFolderDialogOpen(false);
    };
    const { handleSubmit, reset, control } = useForm({
        resolver: zodResolver(z.object({ folderName: z.string().min(1) })),
        defaultValues: { folderName: "" },
    });
    const handleNewFolderDialogSubmit = async (data: {
        folderName: string;
    }) => {
        console.log(data);
        const res = await ServerCreateDirectory(
            currentLocation,
            data.folderName
        );
        if (!res.success) {
            toast.error(res.message);
        } else {
            toast.success(res.message);
        }
        setNewFolderDialogOpen(false);
        reset();
        queryClient.invalidateQueries({
            queryKey: ["s3DirData", currentLocation],
        });
    };

    // Directory Navigation
    const fetchDirectoryListing = async () => {
        const res = await axios.get("/api/dashboardv2/assets/list", {
            params: {
                prefix: !(currentLocation === "" || currentLocation === "/")
                    ? currentLocation
                    : undefined,
            },
        });

        return res.data as ListingItem[];
    };
    const { data: objects, isSuccess } = useQuery({
        queryKey: ["s3DirData", currentLocation],
        queryFn: fetchDirectoryListing,
        staleTime: 60000,
    });

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            for (const file of acceptedFiles) {
                const res = await axios.post<
                    TGeneratePUTSignedURLParams,
                    AxiosResponse<TGeneratePUTSignedURLResponse>
                >(
                    "/api/dashboardv2/assets/upload-raw",
                    {
                        prefix: currentLocation,
                        filename: file.name,
                        mime: file.type,
                    },
                    {
                        validateStatus: () => true,
                    }
                );
                if (res.data.success) {
                    try {
                        const uploadRes = await axios.put(
                            res.data.signedUrl,
                            file,
                            {
                                headers: {
                                    "Content-Length": String(file.size),
                                    "Content-Type": file.type,
                                },
                            }
                        );
                        toast.success(
                            `File ${file.name} has been successfully uploaded`
                        );
                    } catch (error) {
                        toast.error(`Error when uploading ${file.name}`);
                        console.error(error);
                    }
                } else {
                    toast.error(res.data.message);
                }
            }
            queryClient.invalidateQueries({
                queryKey: ["s3DirData", currentLocation],
            });
        },
        [queryClient, currentLocation]
    );

    const handleAssetDelete = async () => {
        console.log("Delete asset called");
        const res = await ServerDeleteAsset(selectedId);
        if (!res.success) {
            toast.error(res.message);
            return;
        }
        toast.success(res.message);
        setSelectedId("");
        setSidebarOpen(false);
        queryClient.invalidateQueries({
            queryKey: ["s3DirData", currentLocation],
        });
    };

    const { getRootProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true,
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
                <p className="font-semibold text-blue-900">Actions</p>
                <div className="flex justify-around">
                    <IconButton
                        size="medium"
                        onClick={() => {
                            handleAssetDelete();
                        }}
                    >
                        <DeleteIcon />
                    </IconButton>
                    <IconButton size="small">
                        <RenameIcon />
                    </IconButton>
                </div>
            </React.Fragment>
        );
    };

    return (
        <>
            <Dialog
                open={newFolderDialogOpen}
                onClose={handleNewFolderDialogClose}
                PaperProps={{
                    component: "form",
                    onSubmit: handleSubmit(handleNewFolderDialogSubmit),
                }}
            >
                <DialogTitle>Create Folder</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        You are about to create a new folder in current
                        location, {currentLocation || "Home"}. Please enter the
                        folder name.
                    </DialogContentText>
                    <Controller
                        name="folderName"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                autoFocus
                                required
                                margin="dense"
                                fullWidth
                                variant="standard"
                            />
                        )}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleNewFolderDialogClose}>Cancel</Button>
                    <Button type="submit">Create</Button>
                </DialogActions>
            </Dialog>
            <Drawer
                anchor="right"
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                sx={{
                    width: 600,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: 600,
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
                        <div className="grid grid-cols-4 gap-1">
                            <DetailPaneData />
                        </div>
                    </div>
                )}
            </Drawer>
            <div
                className="p-4 bg-white flex flex-col h-full relative"
                {...getRootProps()}
            >
                <Typography variant="h3">Assets Browser</Typography>
                <Divider />
                <div className="gap-2 flex py-4 text-xl">
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
                <div>
                    <Button
                        startIcon={<CreateNewFolderIcon />}
                        variant="outlined"
                        onClick={() => {
                            setNewFolderDialogOpen(true);
                        }}
                    >
                        New Folder
                    </Button>
                </div>
                {isSuccess ? (
                    objects.length > 0 ? (
                        <div className="grid grid-cols-4 gap-4 my-4">
                            {objects.map((obj: any) => (
                                <div
                                    key={obj.id}
                                    className={`px-2 py-4 rounded-lg border flex gap-2 ${
                                        selectedId === obj.id
                                            ? "bg-slate-100"
                                            : ""
                                    } hover:cursor-pointer hover:bg-slate-200 transition-colors duration-75`}
                                    onClickCapture={() => {
                                        setSelectedId(obj.id);
                                        if (!obj.isDir) {
                                            setSidebarOpen(true);
                                        }
                                    }}
                                    onDoubleClickCapture={() => {
                                        if (obj.isDir)
                                            setCurrentLocation(obj.id);
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
                        <div className="w-full h-full flex flex-col justify-start items-center pt-16">
                            <p>Empty Folder</p>
                        </div>
                    )
                ) : (
                    <div className="flex justify-center align-middle py-8">
                        <CircularProgress />
                    </div>
                )}
                {isDragActive && (
                    <div className="absolute top-0 left-0 w-full h-full bg-slate-400 bg-opacity-50 flex flex-col justify-center items-center align-middle">
                        <p>Drop File here to upload</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default AssetsBrowserPage;
