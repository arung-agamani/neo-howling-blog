/* eslint-disable @next/next/no-img-element */
// "use client";
import Link from "next/link";

import FloatingContainer from "@/components/FloatingContainer";
import ScrollTop from "@/components/ScrollTop";
import prisma from "@/utils/prisma";
import { headers } from "next/headers";

export default async function Page() {
    const header = headers(); // trigger dynamic
    const posts = await prisma.posts.findMany({
        select: {
            id: true,
            author: true,
            bannerUrl: true,
            title: true,
            description: true,
            datePosted: true,
            tags: true,
        },
        where: {
            isPublished: true,
        },
        orderBy: {
            datePosted: "desc",
        },
        take: 8,
    });

    return (
        <div className=" bg-slate-600 dark:bg-gray-900 pt-2 flex flex-col justify-center max-w-lg lg:max-w-none mx-auto pb-12 lg:px-16 transition-colors duration-100">
            {/* <p className="max-w-5xl text-xl text-center mx-auto my-2 py-8 px-4 border border-gray-600 rounded">
                Welcome to Howling Blog! Here you can see some of my thoughts,
                materialized in the form of blog post.
                <br />
                Use the navigation bar above and floating buttons on bottom left
                of the screen for navigation
            </p> */}
            <p className="text-3xl lg:text-5xl text-white px-2 mb-4 font-thin lg:text-left text-center self-center">
                Recent Posts
            </p>
            <div className="flex">
                <div className="flex flex-col flex-grow max-w-5xl mx-auto">
                    {posts.length > 0 &&
                        posts.map((x: any) => (
                            <Link href={`post/${x.id}`} key={x.id}>
                                <div
                                    className="pb-4 mx-auto mb-4 bg-white dark:bg-slate-800 lg:rounded-lg 
                            shadow w-full flex flex-col transition-colors duration-200"
                                >
                                    {/* <img
                                        src={
                                            x.bannerUrl ||
                                            "https://files.howlingmoon.dev/blog/7-5/1596671970721-no-banner-card-compressed.jpg"
                                        }
                                        alt="This post's banner image"
                                        className="rounded-t-lg w-full h-auto"
                                    /> */}
                                    <p className="uppercase font-bold text-orange-500 px-8 pt-4 transition-colors duration-200">
                                        {x.tags.join(" ")}
                                    </p>
                                    <p className="text-black dark:text-gray-50 text-2xl lg:text-4xl font-bold px-8 mt-4 transition-colors duration-200">
                                        {x.title}
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300 px-8 py-4 lg:py-8 text-lg lg:text-xl font-light transition-colors duration-200">
                                        {x.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    <Link href={"/page/2"}>
                        <div className="justify-center hover:cursor-pointer">
                            <p className="text-2xl text-slate-800 dark:text-slate-200 px-2 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-300 self-center text-center">
                                More Posts
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
            <FloatingContainer>
                <ScrollTop />
            </FloatingContainer>
        </div>
    );
}
