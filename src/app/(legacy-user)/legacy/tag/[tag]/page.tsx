import FloatingContainer from "@/components/FloatingContainer";
import HomeButton from "@/components/HomeButton";
import ScrollTop from "@/components/ScrollTop";
import Link from "next/link";
import prisma from "@/utils/prisma";

interface PathParams {
    tag: string;
}

export const revalidate = 0;
export default async function Page(props: { params: Promise<PathParams> }) {
    const params = await props.params;
    const tag = params.tag;
    if (!tag) {
        return (
            <div className="flex justify-center items-center h-screen">
                <h1 className="text-2xl">Tag not found</h1>
            </div>
        );
    }

    const posts = await prisma.posts.findMany({
        select: {
            id: true,
            author: true,
            bannerUrl: true,
            title: true,
            description: true,
            datePosted: true,
            tags: true
        },
        where: {
            isPublished: true,
            tags: {
                has: tag
            }
        },
        orderBy: {
            datePosted: "desc"
        },
    })

    return (
        <div className=" bg-slate-600 dark:bg-gray-900 pt-2 flex flex-col justify-center max-w-lg lg:max-w-none mx-auto pb-12 lg:px-16">
            <p className="text-3xl lg:text-5xl text-white px-2 mb-4 font-thin lg:text-left text-center self-center">
                Tag <span className="font-bold">{tag}</span>
            </p>
            <div className="flex">
                <div className="flex flex-col flex-grow max-w-5xl mx-auto">
                    {posts.length > 0 &&
                        posts.map((x) => (
                            <Link href={`/post/${x.id}`} key={x.id}>
                                <div
                                    className="pb-4 mx-auto mb-4 bg-white dark:bg-slate-800 lg:rounded-lg 
                            shadow w-full flex flex-col"
                                >
                                    {/* <img
                                        src={
                                            x.bannerUrl ||
                                            "https://files.howlingmoon.dev/blog/7-5/1596671970721-no-banner-card-compressed.jpg"
                                        }
                                        alt="This post's banner image"
                                        className="rounded-t-lg w-full h-auto"
                                    /> */}
                                    <p className="uppercase font-bold text-orange-500 px-8 pt-4">
                                        {x.tags.join(" ")}
                                    </p>
                                    <p className="text-black dark:text-gray-50 text-2xl lg:text-4xl font-bold px-8 mt-4">
                                        {x.title}
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300 px-8 py-4 lg:py-8 text-lg lg:text-xl font-light">
                                        {x.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                </div>
            </div>
            <FloatingContainer>
                <ScrollTop />
                <HomeButton />
            </FloatingContainer>
        </div>
    )
}