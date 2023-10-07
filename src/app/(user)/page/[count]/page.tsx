/* eslint-disable @next/next/no-img-element */
import FloatingContainer from "@/components/FloatingContainer";
import HomeButton from "@/components/HomeButton";
import ScrollTop from "@/components/ScrollTop";
import Link from "next/link";
import { redirect } from "next/navigation";
import "../../post/[id]/post.css";

interface Params {
    count: string;
}

export const revalidate = 0;

export default async function Page({ params }: { params: Params }) {
    const page = Number(params.count);
    const maxPost = await prisma.posts.count({ where: { isPublished: true } });
    if (page < 1) {
        redirect("/page/1");
    }
    if (page > Math.ceil(maxPost / 8)) {
        redirect(`/page/${Math.ceil(maxPost / 8)}`);
    }
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
        skip: Number(page - 1) * 8,
    });

    return (
        <div className="bg-gray-700 pt-2 flex flex-col  justify-center max-w-lg lg:max-w-none mx-auto pb-12 lg:px-16">
            <p className="text-3xl lg:text-5xl text-white px-2 mb-4 font-thin lg:text-left text-center self-center">
                Page {page}
            </p>
            <div className="flex">
                <div className="flex flex-col flex-grow max-w-5xl mx-auto">
                    {posts.length > 0 &&
                        posts.map((x: any) => (
                            <Link href={`/post/${x.id}`} key={x.id}>
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
                        ))}
                    <div className="grid grid-cols-2 gap-2">
                        {page > 1 && (
                            <Link href={`/page/${page - 1}`}>
                                <div className="justify-center hover:cursor-pointer">
                                    <p className="text-2xl text-slate-800 px-2 py-2 bg-slate-50 hover:bg-slate-300 self-center text-center">
                                        Previous Page
                                    </p>
                                </div>
                            </Link>
                        )}

                        <Link
                            href={`/page/${page + 1}`}
                            className={`${page === 1 ? "col-span-2" : ""}`}
                        >
                            <div
                                className={`justify-center hover:cursor-pointer `}
                            >
                                <p className="text-2xl text-slate-800 px-2 py-2 bg-slate-50 hover:bg-slate-300 self-center text-center">
                                    Next Page
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
            <p className="text-3xl lg:text-5xl text-white px-2 mt-4 font-thin lg:text-left text-center self-center">
                Page {page}
            </p>
            <FloatingContainer>
                <ScrollTop />
                <HomeButton />
            </FloatingContainer>
        </div>
    );
}
