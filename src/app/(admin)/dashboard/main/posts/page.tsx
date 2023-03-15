import prisma from "@/utils/prisma";
import Link from "next/link";
import PostItem from "@/components/Dashboard/PostItem";

async function getPosts() {
    const result = await prisma.posts.findMany({
        select: {
            title: true,
            link: true,
            tags: true,
            description: true,
            bannerUrl: true,
            isBannerDark: true,
            isPublished: true,
            datePosted: true,
            id: true,
        },
        orderBy: {
            datePosted: "desc",
        },
    });
    return result;
}

export default async function Page() {
    const posts = await getPosts();
    return (
        <>
            <div className="px-2 py-2">
                <Link href={"/dashboard/main/posts/edit"}>
                    <p className="text-4xl bg-blue-900 text-white px-2 py-2">
                        New Post
                    </p>
                </Link>
            </div>
            {posts &&
                posts.map((post) => <PostItem key={post.id} post={post} />)}
        </>
    );
}
