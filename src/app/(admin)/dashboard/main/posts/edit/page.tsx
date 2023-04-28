/* eslint-disable @next/next/no-img-element */
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import { toast } from "react-toastify";
import axios from "@/utils/axios";
import ImageUploader from "quill-image-uploader";
import QuillMarkdown from "quilljs-markdown";
import "quilljs-markdown/dist/quilljs-markdown-common-style.css";
import "react-quill/dist/quill.snow.css";
import "./editor.css";

interface PostMetadata {
    author?: string;
    title?: string;
    description?: string;
    bannerUrl?: string;
    tags?: string[];
}

Quill.register("modules/imageUploader", ImageUploader);
Quill.register("modules/QuillMarkdown", QuillMarkdown, true);

export default function Page() {
    const [content, setContent] = useState("");
    const [page, setPage] = useState<PostMetadata>({});
    const [isModified, setIsModified] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const titleInputRef = useRef<HTMLTextAreaElement>(null);
    const descInputRef = useRef<HTMLTextAreaElement>(null);
    const bannerUrlRef = useRef<HTMLTextAreaElement>(null);
    const imagePrevRef = useRef<HTMLImageElement>(null);
    const tagsRef = useRef<HTMLTextAreaElement>(null);
    const quillRef = useRef<ReactQuill>(null);
    const searchParams = useSearchParams();
    useEffect(() => {
        (async () => {
            if (!searchParams) return;
            const id = searchParams.get("id");
            if (!id) return;

            try {
                const res = await axios.get("/api/dashboard/post", {
                    params: {
                        id,
                    },
                });
                setContent(res.data.data.page.blogContent);
                console.log(res.data.data.page);
                setPage(res.data.data.page);
                setIsSynced(true);
            } catch (error) {
                setContent("<h1>Failed to fetch content</h1>");
            } finally {
                const toolbarHeight =
                    document.getElementsByClassName("ql-toolbar")[0]
                        .clientHeight;
                const qlContainer = document.getElementsByClassName(
                    "ql-container"
                )[0] as HTMLDivElement;
                qlContainer.style.maxHeight = `${
                    window.innerHeight - toolbarHeight
                }px`;
            }
        })();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const quillModule = useMemo(
        () => ({
            toolbar: {
                container: [
                    [{ header: [1, 2, 3, 4, 5, 6, false] }],
                    ["bold", "italic", "underline", "strike"],
                    ["blockquote", "code-block"],
                    [{ size: ["small", false, "large", "huge"] }],
                    [
                        { list: "ordered" },
                        { list: "bullet" },
                        { indent: "-1" },
                        { indent: "+1" },
                    ],
                    [{ align: [] }],
                    ["link", "image"],
                    ["clean"],
                ],
                handlers: {
                    image: imageHandler,
                },
            },
            QuillMarkdown: {},
            imageUploader: {
                upload: (file: File) => {
                    return new Promise((resolve, reject) => {
                        (async () => {
                            const loadedFile = file;
                            const date = new Date();
                            const buf = new Uint8Array(4);
                            const randPrefix = Buffer.from(
                                crypto.getRandomValues(buf)
                            ).toString("hex");

                            try {
                                const head = await fetch(
                                    `https://howling-blog-uploads.s3.ap-southeast-1.amazonaws.com/${date.getFullYear()}/${
                                        date.getMonth() + 1
                                    }/${date.getDate()}/${randPrefix}_${
                                        loadedFile?.name
                                    }`,
                                    {
                                        method: "HEAD",
                                    }
                                );
                                if (head.ok) {
                                    toast.info(
                                        `File ${randPrefix}_${loadedFile?.name} has already been uploaded.`
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
                                            name: `${randPrefix}_${loadedFile?.name}`,
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
                                        "Content-Length": String(
                                            loadedFile!.size
                                        ),
                                    },
                                    body: loadedFile,
                                }).then((res) => res.ok);
                                if (!upload) {
                                    toast.error(
                                        `Error when uploading ${loadedFile?.name}`
                                    );
                                }
                                toast.success(
                                    `File ${loadedFile?.name} has been successfully uploaded`
                                );
                                resolve(
                                    `https://howling-blog-uploads.s3.ap-southeast-1.amazonaws.com/${date.getFullYear()}/${
                                        date.getMonth() + 1
                                    }/${date.getDate()}/${randPrefix}_${
                                        loadedFile?.name
                                    }`
                                );
                            } catch (error) {
                                toast.error(
                                    `Error when uploading ${loadedFile?.name}`
                                );
                                console.error(error);
                                reject("Upload failed. Check logs");
                            }
                        })();
                    });
                },
            },
            syntax: true,
        }),
        []
    );
    // if (typeof window == "undefined") return null;
    const previewBannerUrl = () => {
        if (!bannerUrlRef.current) return;

        fetch(bannerUrlRef.current.value, { method: "HEAD" })
            .then((res) => res.headers.get("content-type")?.startsWith("image"))
            .then(() => {
                const img = imagePrevRef.current;
                if (!img) return;
                img.src = bannerUrlRef.current!.value;
                img.className = "w-full h-auto";
            })
            .catch(() => {
                const img = imagePrevRef.current;
                if (!img) return;
                img.className = "hidden";
            });
    };

    const saveHandler = async () => {
        const id = searchParams!.get("id");
        let op: "update" | "create" = "update";
        if (!id) op = "create";

        if (op === "update") {
            try {
                const res = await axios.post("/api/dashboard/post", {
                    id,
                    op: "update",
                    content,
                    title: titleInputRef.current?.value,
                    description: descInputRef.current?.value,
                    bannerUrl: bannerUrlRef.current?.value,
                    tags: tagsRef.current?.value.split(","),
                });
                if (res.status == 200) {
                    setIsSynced(true);
                    setIsModified(false);
                    toast.success("Post updated!", {
                        position: toast.POSITION.TOP_CENTER,
                        autoClose: 3000,
                        closeOnClick: true,
                        theme: "light",
                    });
                    return;
                }
            } catch (e) {
                console.error(e);
                toast.error("Post updating failed");
                return;
            }
        } else if (op === "create") {
            try {
                const res = await axios.post("/api/dashboard/post", {
                    author: "Shirayuki Haruka",
                    op,
                    content,
                    datePosted: new Date(),
                    description: descInputRef.current?.value,
                    link: "",
                    tags: [],
                    title: titleInputRef.current?.value,
                });

                if (res.status == 200) {
                    setIsSynced(true);
                    setIsModified(false);
                    toast.success("Post created!");
                    // setTimeout(() => {
                    //     router.push(`/dashboard/main/posts/edit?id=${res.data.}`)
                    // }, 3000);
                    console.log(res.data);
                    return;
                }
            } catch (e) {
                console.error(e);
                toast.error("Post creation failed");
                return;
            }
        }
    };

    function imageHandler() {
        if (!quillRef.current) return;

        const editor = quillRef.current.getEditor();
        const range = editor.getSelection();
        const value = prompt("Please enter image url");
        if (value && range) {
            editor.insertEmbed(range.index, "image", value, "user");
        }
    }

    return (
        <>
            <div className="flex">
                <div className="flex-grow">
                    <ReactQuill
                        className="bg-white post h-full overflow-y-hidden"
                        value={content}
                        onChange={(c) => {
                            setIsSynced(false);
                            setIsModified(true);
                            setContent(c);
                        }}
                        onBlur={(p, s, e) => {
                            setIsSynced(true);
                        }}
                        modules={quillModule}
                        ref={quillRef}
                    />
                </div>
                <div className="py-2 bg-white text-black sticky h-screen top-0 flex flex-col w-full max-w-xs">
                    <div className="mx-2 pb-4">
                        <label className="text-xl">Title</label>
                        <textarea
                            name="title"
                            className="border border-slate-400 rounded-lg px-2 py-1 w-full"
                            ref={titleInputRef}
                            defaultValue={page.title}
                            wrap="soft"
                        />
                        <label className="text-xl">Description</label>
                        <textarea
                            name="description"
                            className="border border-slate-400 rounded-lg px-2 py-1 w-full"
                            ref={descInputRef}
                            defaultValue={page.description}
                            wrap="soft"
                        />
                        <label htmlFor="" className="text-xl">
                            Banner
                        </label>
                        <textarea
                            name="bannerUrl"
                            id=""
                            className="border border-slate-400 rounded-lg px-2 py-1 w-full"
                            ref={bannerUrlRef}
                            wrap="soft"
                            defaultValue={page.bannerUrl}
                            onChange={previewBannerUrl}
                        />
                        <label htmlFor="" className="text-xl">
                            Tags
                        </label>
                        <textarea
                            name="tags"
                            className="border border-slate-400 rounded-lg px-2 py-1 w-full"
                            ref={tagsRef}
                            wrap="soft"
                            defaultValue={page.tags?.join(",")}
                        />
                        <img
                            src=""
                            alt=""
                            id="bannerPreview"
                            ref={imagePrevRef}
                            className="hidden"
                        />
                    </div>

                    {isModified ? (
                        <span className="font-bold px-2 py-2 text-center bg-red-500">
                            Modified
                        </span>
                    ) : (
                        <span className="font-bold px-2 py-2 text-center bg-green-500">
                            Not modified
                        </span>
                    )}
                    {isSynced ? (
                        <span className="font-bold px-2 py-2 text-center bg-green-500">
                            Synced
                        </span>
                    ) : (
                        <span className="font-bold px-2 py-2 text-center bg-red-500">
                            Not synced
                        </span>
                    )}
                    <button
                        className="px-2 py-2 bg-blue-400 hover:bg-blue-200 w-full text-white"
                        onClick={saveHandler}
                    >
                        Save
                    </button>
                </div>
            </div>
        </>
    );
}
