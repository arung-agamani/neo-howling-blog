"use client";

import Link from "next/link";
import {
    useCallback,
    useState,
    useMemo,
    Dispatch,
    SetStateAction,
} from "react";
import { useDropzone } from "react-dropzone";
import { PanelGroup, PanelResizeHandle, Panel } from "react-resizable-panels";
import { toast } from "react-toastify";
import { z } from "zod";

const prettyPrintSize = (size: number) => {
    if (size >= 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    } else if (size >= 1024) {
        return `${(size / 1024).toFixed(2)} kB`;
    } else {
        return `${size} Bytes`;
    }
};

// const Item: React.FC<{ file: File, selectLoadedFile: Dispatch<SetStateAction<number | null>> }> = ({ file, selectLoadedFile }) => {
//     return <div
//     key={file.name}
//     className="bg-slate-800 rounded-lg px-2 py-2 mb-2"
//     onClick={() => {
//         selectLoadedFile(index);
//     }}
// >
//     <p className="text-xl">
//         {index}-{file.name}
//     </p>
//     <p className="text-lg">Type: {file.type}</p>
//     <p className="text-lg">
//         Size: {prettyPrintSize(file.size)}
//     </p>
// </div>
// }

export default function Page() {
    const [files, setFiles] = useState<File[]>([]);
    const [loadedFile, setLoadedFile] = useState<File | null>(null);
    const [loadedFileIndex, setLoadedFileIndex] = useState<number>(-1);
    const date = new Date();
    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(acceptedFiles);
        if (acceptedFiles.length > 0) {
            setLoadedFile(acceptedFiles[0]);
            setLoadedFileIndex(0);
        }
    }, []);

    const selectLoadedFile = (index: number) => {
        setLoadedFile(files[index]);
    };

    const uploadFile = async () => {
        // test if file already exist over there
        try {
            const head = await fetch(
                `https://howling-blog-uploads.s3.ap-southeast-1.amazonaws.com/${date.getFullYear()}/${
                    date.getMonth() + 1
                }/${date.getDate()}/${loadedFile?.name}`,
                {
                    method: "HEAD",
                }
            );
            if (head.ok) {
                toast.info(
                    `File ${loadedFile?.name} has already been uploaded.`
                );
                return;
            }
        } catch (error) {}
        try {
            toast.info(`Uploading ${loadedFile?.name}...`);
            const presignedUrl = await fetch(
                `${window.location.origin}/api/dashboard/upload`,
                {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify({
                        name: loadedFile?.name,
                        size: loadedFile?.size,
                        mime: loadedFile?.type,
                        date: {
                            year: date.getFullYear(),
                            month: date.getMonth() + 1,
                            day: date.getDate(),
                        },
                    }),
                }
            ).then((res) => res.json());
            const upload = await fetch(presignedUrl.data, {
                method: "PUT",
                headers: {
                    "Content-Length": String(loadedFile!.size),
                },
                body: loadedFile,
            }).then((res) => res.ok);
            if (!upload) {
                toast.error(`Error when uploading ${loadedFile?.name}`);
            }
            toast.success(
                `File ${loadedFile?.name} has been successfully uploaded`
            );
            return;
        } catch (error) {
            toast.error(`Error when uploading ${loadedFile?.name}`);
            console.error(error);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/png": [".png"],
            "image/jpeg": [".jpeg", ".jpg"],
        },
    });
    return (
        <PanelGroup direction="horizontal">
            <Panel
                defaultSize={80}
                minSize={40}
                className="text-slate-200 px-2"
            >
                <p className="text-2xl">File Uploader: </p>
                {date.getFullYear() +
                    "/" +
                    date.getMonth() +
                    "/" +
                    date.getDate() +
                    " | " +
                    date.getHours()}
                <div
                    {...getRootProps()}
                    className={`p-4 ${
                        isDragActive ? "bg-blue-100" : "bg-blue-200"
                    } text-center text-blue-700 text-xl`}
                    style={{
                        transition: "background-color 500ms",
                    }}
                >
                    <div className="p-6 border-blue-900 border-dashed border-2">
                        <input {...getInputProps()} />
                        {isDragActive ? (
                            <p>Drop the files here...</p>
                        ) : (
                            <p>
                                Drag n drop some files here, or click to select
                                files
                            </p>
                        )}
                    </div>
                </div>
                <div>
                    {files.length === 0 ? (
                        <p>No files loaded</p>
                    ) : (
                        <div>
                            <p className="text-3xl">Loaded Files</p>
                            {files.map((file, index) => (
                                <div
                                    key={file.name}
                                    className={`${
                                        loadedFileIndex === index
                                            ? "bg-slate-600"
                                            : "bg-slate-800"
                                    } rounded-lg px-2 py-2 mb-2`}
                                    onClick={() => {
                                        selectLoadedFile(index);
                                        setLoadedFileIndex(index);
                                    }}
                                >
                                    <p className="text-xl">
                                        {index + 1}. {file.name}
                                    </p>
                                    <p className="text-lg">Type: {file.type}</p>
                                    <p className="text-lg">
                                        Size: {prettyPrintSize(file.size)}
                                    </p>
                                    <p className="text-md">
                                        Projected link:{" "}
                                        <a
                                            href={`https://howling-blog-uploads.s3.ap-southeast-1.amazonaws.com/${date.getFullYear()}/${
                                                date.getMonth() + 1
                                            }/${date.getDate()}/${
                                                loadedFile?.name
                                            }`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
                                        >
                                            <span>{`https://howling-blog-uploads.s3.ap-southeast-1.amazonaws.com/${date.getFullYear()}/${
                                                date.getMonth() + 1
                                            }/${date.getDate()}/${
                                                loadedFile?.name
                                            }`}</span>
                                        </a>
                                    </p>
                                    <div
                                        onClick={uploadFile}
                                        className="hover:cursor-pointer bg-green-700 hover:bg-green-500 text-slate-300 font-bold text-center px-2 py-2 rounded-lg"
                                    >
                                        Upload
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Panel>
            {/* <PanelResizeHandle />
            <Panel>Empty panel</Panel> */}
            <PanelResizeHandle
                style={{
                    background: "gray",
                    width: "3px",
                }}
            />
            <Panel
                defaultSize={20}
                className="text-slate-200 px-16 py-16 max-h-screen overflow-y-scroll"
            >
                <img src={loadedFile ? URL.createObjectURL(loadedFile) : ""} />
            </Panel>
        </PanelGroup>
    );
}
