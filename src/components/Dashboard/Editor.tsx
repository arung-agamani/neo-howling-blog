"use client";
import {
    Dispatch,
    SetStateAction,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import ReactQuill, { Quill } from "react-quill";
import ImageUploader from "quill-image-uploader";
import QuillMarkdown from "quilljs-markdown";
import QuillBlotFormatter from "quill-blot-formatter";
import { toast } from "react-toastify";
import "quilljs-markdown/dist/quilljs-markdown-common-style.css";
import "react-quill/dist/quill.snow.css";
import "./EditorOverride.css";

interface PostMetadata {
    author?: string;
    title?: string;
    description?: string;
    bannerUrl?: string;
    tags?: string[];
}

interface Props {
    page: PostMetadata;
    setPage: Dispatch<SetStateAction<PostMetadata>>;
    content: string;
    setContent: Dispatch<SetStateAction<string>>;

    isModified: boolean;
    isSynced: boolean;
    setIsModified: Dispatch<SetStateAction<boolean>>;
    setIsSynced: Dispatch<SetStateAction<boolean>>;
}

Quill.register("modules/imageUploader", ImageUploader);
Quill.register("modules/QuillMarkdown", QuillMarkdown, true);
Quill.register("modules/blotFormatter", QuillBlotFormatter);

const Editor: React.FC<Props> = ({
    page,
    isModified,
    isSynced,
    content,
    setPage,
    setIsModified,
    setIsSynced,
    setContent,
}) => {
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
            blotFormatter: true,
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

    const quillRef = useRef<any>(null);

    useEffect(() => {
        const toolbarHeight =
            document.getElementsByClassName("ql-toolbar")[0].clientHeight;
        const qlContainer = document.getElementsByClassName(
            "ql-container"
        )[0] as HTMLDivElement;
        qlContainer.style.maxHeight = `${window.innerHeight - toolbarHeight}px`;
    }, []);

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
        <ReactQuill
            className="bg-white post h-full overflow-y-hidden"
            value={content}
            onChange={(c: any) => {
                setIsSynced(false);
                setIsModified(true);
                setContent(c);
            }}
            onBlur={(p: any, s: any, e: any) => {
                setIsSynced(true);
            }}
            modules={quillModule}
            ref={quillRef as any}
        />
    );
};

export default Editor;
