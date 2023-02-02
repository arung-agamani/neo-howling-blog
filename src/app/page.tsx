import Link from "next/link";
import prisma from "@/utils/prisma";
import Image from "next/image";

interface PostResult {
    params: {
        id: string;
        title: string;
        desc: string;
        datePosted: string;
        bannerUrl: string;
        link: string;
    };
}

async function getPosts() {
    try {
        const result = await prisma.posts.findMany({
            select: {
                title: true,
                link: true,
                tags: true,
                description: true,
                bannerUrl: true,
                isBannerDark: true,
                id: true,
            },
            orderBy: {
                datePosted: "desc",
            },
            take: 8,
        });
        return result;
    } catch (error) {
        return null;
    }
}

export default async function Page() {
    const posts = await getPosts();
    return (
        <div className="bg-gray-700 pt-2 flex flex-col  justify-center max-w-lg lg:max-w-none mx-auto pb-12 lg:px-16">
            <p className="text-3xl lg:text-5xl text-white px-2 mb-4 font-thin lg:text-left text-center">
                Recent Posts
            </p>
            <div className="flex">
                <div className="flex flex-col">
                    {posts &&
                        posts.map((x) => (
                            <Link
                                href={`page/${x.id}`}
                                key={x.id}
                                className="w-full"
                            >
                                <div
                                    className="pb-4 mx-auto mb-4 bg-white lg:rounded-lg 
                            shadow w-full flex flex-col"
                                >
                                    <img
                                        src={x.bannerUrl || ""}
                                        alt="This post's banner image"
                                        className="rounded-t-lg w-full h-auto"
                                    />
                                    <p className="uppercase font-bold text-orange-500 px-8 pt-4">
                                        {["javascript", "tech"].join(" ")}
                                    </p>
                                    <p className="text-black text-2xl lg:text-4xl font-bold px-8 mt-4">
                                        {x.title}
                                    </p>
                                    <p className="text-gray-700 px-8 py-4 lg:py-8 text-lg lg:text-xl font-light">
                                        {x.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                </div>
                <div
                    className="bg-white ml-8 rounded-t-lg pb-8 w-full h-full lg:flex lg:flex-col justify-center align-top max-w-lg
                hidden 
            "
                >
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
                </div>
            </div>
        </div>
    );
}
