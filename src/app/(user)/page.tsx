/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import axios from "@/utils/axios";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function Page() {
    const [posts, setPosts] = useState<any>([]);
    const [page, setPage] = useState(1);
    useEffect(() => {
        (async () => {
            try {
                const { data } = await axios.get("/api/posts", {
                    params: { p: page },
                });
                setPosts(data.data);
            } catch (error) {}
        })();
    }, []);

    const loadPost = () => {
        (async () => {
            try {
                const { data } = await axios.get("/api/posts", {
                    params: { p: page + 1 },
                });
                setPosts([...posts, ...data.data]);
                setPage(page + 1);
            } catch (error) {}
        })();
    };

    if (!posts) return null;
    return (
        <div className="bg-gray-700 pt-2 flex flex-col  justify-center max-w-lg lg:max-w-none mx-auto pb-12 lg:px-16">
            <p className="text-3xl lg:text-5xl text-white px-2 mb-4 font-thin lg:text-left text-center self-center">
                Recent Posts
            </p>
            <div className="flex">
                <div className="flex flex-col flex-grow max-w-5xl mx-auto">
                    {posts.length > 0 ? (
                        posts.map((x: any) => (
                            <Link
                                href={`post/${x.id}`}
                                key={x.id}
                                // className="w-full"
                            >
                                <div
                                    className="pb-4 mx-auto mb-4 bg-white lg:rounded-lg 
                            shadow w-full flex flex-col"
                                >
                                    <img
                                        src={
                                            x.bannerUrl ||
                                            "https://files.howlingmoon.dev/blog/7-5/1596671970721-no-banner-card-compressed.jpg"
                                        }
                                        alt="This post's banner image"
                                        className="rounded-t-lg w-full h-auto"
                                    />
                                    <p className="uppercase font-bold text-orange-500 px-8 pt-4">
                                        {x.tags.join(" ")}
                                    </p>
                                    <p className="text-black text-2xl lg:text-4xl font-bold px-8 mt-4">
                                        {x.title}
                                    </p>
                                    <p className="text-gray-700 px-8 py-4 lg:py-8 text-lg lg:text-xl font-light">
                                        {x.description}
                                    </p>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div
                            className="pb-4 mx-auto mb-4 bg-white lg:rounded-lg 
                            shadow w-full flex flex-col"
                        >
                            <Skeleton
                                height={300}
                                className="rounded-t-lg w-full "
                                containerClassName=""
                            />
                            {/* <img
                                alt="This post's banner image"
                                className="rounded-t-lg w-full h-auto"
                            >
                            </img> */}
                            <p className="uppercase font-bold text-orange-500 px-8 pt-4">
                                <Skeleton count={0.5} />
                            </p>
                            <p className="text-black text-2xl lg:text-4xl font-bold px-8 mt-4">
                                <Skeleton />
                            </p>
                            <p className="text-gray-700 px-8 py-4 lg:py-8 text-lg lg:text-xl font-light">
                                <Skeleton count={3.5} />
                            </p>
                        </div>
                    )}
                    <div
                        className="justify-center hover:cursor-pointer"
                        onClick={loadPost}
                    >
                        <p className="text-2xl text-slate-800 px-2 py-2 bg-slate-50 hover:bg-slate-300 self-center text-center">
                            Load More
                        </p>
                    </div>
                </div>
                {/* <div className="bg-white ml-8 rounded-t-lg pb-8 w-full h-full lg:flex lg:flex-col justify-center align-top max-w-lg hidden">
                    <p className="text-3xl font-semibold text-center mb-2">
                        Good Stuff
                    </p>
                    {[
                        "https://howling-blog-uploads.s3.ap-southeast-1.amazonaws.com/2023/2/3/94001464_p0.png",
                        "https://howling-blog-uploads.s3.ap-southeast-1.amazonaws.com/2023/2/3/100827958_p0.jpg",
                        "https://howling-blog-uploads.s3.ap-southeast-1.amazonaws.com/2023/2/3/100597943_p0_master1200.jpg",
                        "https://howling-blog-uploads.s3.ap-southeast-1.amazonaws.com/2023/2/3/100597943_p1_master1200.jpg",
                    ].map((x) => (
                        <img src={x} alt={"Some good stuffs"} key={x} />
                    ))}
                </div> */}
            </div>
        </div>
    );
}
