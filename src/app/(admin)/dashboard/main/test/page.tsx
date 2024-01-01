/* eslint-disable @next/next/no-img-element */
"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import axios from "@/utils/axios";
import debounce from "lodash.debounce";

import "./editor.css";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const Editor = dynamic(() => import("@/components/Dashboard/Editorv2"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

interface PostMetadata {
  author?: string;
  title?: string;
  description?: string;
  bannerUrl?: string;
  tags?: string[];
}

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

  const router = useRouter();

  const searchParams = useSearchParams();
  useEffect(() => {
    (async () => {
      if (!searchParams) return;
      const id = searchParams.get("id");
      if (!id) return;

      try {
        const res = await axios.get("/api/dashboardv2/post/get", {
          params: {
            id,
          },
        });
        setContent(res.data.blogContent);
        console.log(res.data);
        setPage(res.data);
        setIsSynced(true);
      } catch (error) {
        setContent("<h1>Failed to fetch content</h1>");
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveHandler = (...a: any[]) => null;
  // const saveHandler = useCallback(
  //   debounce(async (content) => {
  //     const url = new URL(window.location.href);
  //     const id = url.searchParams!.get("id");
  //     let op: "update" | "create" = "update";
  //     if (!id) op = "create";
  //     if (op === "update") {
  //       try {
  //         const res = await axios.post("/api/dashboardv2/post/update", {
  //           id,
  //           op: "update",
  //           blogContent: content,
  //           title: titleInputRef.current?.value,
  //           description: descInputRef.current?.value,
  //           bannerUrl: bannerUrlRef.current?.value,
  //           tags: tagsRef.current?.value.split(","),
  //         });
  //         if (res.status == 200) {
  //           setIsSynced(true);
  //           setIsModified(false);
  //           toast.success("Post updated!", {
  //             position: toast.POSITION.TOP_CENTER,
  //             autoClose: 3000,
  //             closeOnClick: true,
  //             theme: "light",
  //           });
  //           return;
  //         }
  //       } catch (e) {
  //         console.error(e);
  //         toast.error("Post updating failed");
  //         return;
  //       }
  //     } else if (op === "create") {
  //       try {
  //         const res = await axios.post("/api/dashboardv2/post/create", {
  //           author: "Shirayuki Haruka",
  //           op,
  //           blogContent: content,
  //           datePosted: new Date(),
  //           description: descInputRef.current?.value,
  //           link: "",
  //           tags: [],
  //           title: titleInputRef.current?.value,
  //         });

  //         if (res.status == 200) {
  //           setIsSynced(true);
  //           setIsModified(false);
  //           toast.success("Post created!");
  //           setTimeout(() => {
  //             router.push(`/dashboard/main/posts/edit?id=${res.data.data.id}`);
  //           }, 3000);
  //           console.log(res.data);
  //           return;
  //         }
  //       } catch (e) {
  //         console.error(e);
  //         toast.error("Post creation failed");
  //         return;
  //       }
  //     }
  //   }, 30000),
  //   []
  // );

  useEffect(() => {
    saveHandler(content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);
  return (
    <>
      <div className="flex">
        <div className="flex-grow">
          <Editor
            {...{
              page,
              setPage,
              content,
              setContent,
              isModified,
              setIsModified,
              isSynced,
              setIsSynced,
            }}
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
