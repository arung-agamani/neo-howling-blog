"use client";

import { useQuill } from "react-quilljs";

import QuillMarkdown from "quilljs-markdown";
import QuillImageUploader from "quill-image-uploader";
import QuillBlotFormatter from "quill-blot-formatter";
import { toast } from "react-toastify";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import "quill/dist/quill.snow.css";
import "highlight.js/styles/monokai-sublime.css";
import hljs from "highlight.js";
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
// TODO: fix codeblock not working
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
    const imageUploader = (file: File) => {
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
                        }/${date.getDate()}/${randPrefix}_${loadedFile?.name}`,
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
                        `${window.location.origin}/api/dashboardv2/assets/upload`,
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
                    resolve(
                        `https://howling-blog-uploads.s3.ap-southeast-1.amazonaws.com/${date.getFullYear()}/${
                            date.getMonth() + 1
                        }/${date.getDate()}/${randPrefix}_${loadedFile?.name}`
                    );
                } catch (error) {
                    toast.error(`Error when uploading ${loadedFile?.name}`);
                    console.error(error);
                    reject("Upload failed. Check logs");
                }
            })();
        });
    };
    const { quill, quillRef, Quill } = useQuill({
        modules: {
            // QuillMarkdown: true,
            imageUploader: {
                upload: imageUploader,
            },
            // blotFormatter: true,
            syntax: true,
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
            },
        },
    });
    const [initialized, setInitialized] = useState(false);

    if (Quill && !quill) {
        // Quill.register("modules/QuillMarkdown", QuillMarkdown, true);
        Quill.register("modules/imageUploader", QuillImageUploader);
        // Quill.register("modules/blotFormatter", QuillBlotFormatter);
    }

    useEffect(() => {
        if (quill) {
            // if (!initialized) {
            quill.clipboard.dangerouslyPasteHTML(content);
            //   setInitialized(true);
            // }
            quill.on("text-change", () => {
                // console.log(quill.root.innerHTML);
                setContent(quill.root.innerHTML);
                setIsModified(true);
                setIsSynced(false);
            });
        }
    }, [quill]);

    return <div ref={quillRef}></div>;
};

export default Editor;
