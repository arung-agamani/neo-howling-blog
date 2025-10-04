import React from "react";
import Link from "next/link";
import prisma from "@/utils/prisma"
import { Blockquote, Heading, Lead, Text, Muted } from "@/components/Typography";
import { Fragment, jsx, jsxs } from "react/jsx-runtime"
import { unified } from "unified";
import rehypeParse from "rehype-parse"
import rehypeReact from "rehype-react";
import RecommendedPosts from "@/components/UserPageV2/RecommendedPost";
import { Metadata } from "next";
import PageReadySignal from "@/components/UserPageV2/PageReadySignal";

const makeHeading = (level: 1 | 2 | 3 | 4 | 5 | 6 | undefined = 1) => {
    const c = ({ children }: { children: React.ReactNode }) => {
        return <Heading level={level} className="mt-4 mb-2">{children}</Heading>
    }
    return c;
}

const CustomParagraph = ({ children }: { children: React.ReactNode }) => {
    return <Text className="mb-4 leading-relaxed overflow-hidden">{children}</Text>
}

const CustomUnorderedList = ({ children }: { children: React.ReactNode }) => {
    return (
        <ul className="my-6 ml-6 space-y-2 list-disc marker:text-blue-500 dark:marker:text-blue-400 
                       text-slate-900 dark:text-slate-100">
            {children}
        </ul>
    )
}

const CustomOrderedList = ({ children }: { children: React.ReactNode }) => {
    return (
        <ol className="my-6 ml-6 space-y-2 list-decimal marker:text-blue-500 dark:marker:text-blue-400 
                       marker:font-semibold text-slate-900 dark:text-slate-100">
            {children}
        </ol>
    )
}

const CustomListItem = ({ children }: { children: React.ReactNode }) => {
    return (
        <li className="pl-2 leading-relaxed hover:text-blue-600 dark:hover:text-blue-300 
                       transition-colors duration-200">
            {children}
        </li>
    )
}

// Custom blockquote component
const CustomBlockquote = ({ children }: { children: React.ReactNode }) => {
    return <Blockquote className="my-6">{children}</Blockquote>
}

const componentMap: any = {
    h1: makeHeading(3),
    h2: makeHeading(4),
    h3: makeHeading(5),
    h4: makeHeading(6),
    h5: makeHeading(6),
    h6: makeHeading(6),
    p: CustomParagraph,
    ul: CustomUnorderedList,
    ol: CustomOrderedList,
    li: CustomListItem,
    blockquote: CustomBlockquote,
    img: (props: any) => <img {...props} className="my-4" alt={props.alt || "Post image"} />,
    // img: (props: any) => <span>Debug Image</span>,
    a: (props: any) => <a {...props} className="text-blue-600 dark:text-blue-400 hover:underline break-all inline-block" />
    // a: (props: any) => <span>Debug link</span>
}

export async function generateMetadata(props: { params: Promise<{ identifier: string }> }): Promise<Metadata> {
    const params = await props.params;
    const { identifier } = params;
    const postData = await prisma.posts.findFirst({
        where: {
            id: identifier
        }
    })

    const metadata: Metadata = {
        title: postData?.title || "Post not found",
        description: postData?.description || "The requested post could not be found.",
        metadataBase: new URL("https://blog.howlingmoon.dev"),
        openGraph: {
            title: postData?.title || "Post not found",
            description: postData?.description || "The requested post could not be found.",
            url: `https://blog.howlingmoon.dev/v2/post/${identifier}`,
            images: [
                {
                    url: postData?.bannerUrl || "https://cdn.howlingmoon.dev/123623765.jpg",
                },
            ],
            type: "article",
        },
    }

    return metadata;
}


export default async function PostDetailPage({
    params
}: { params: Promise<{ identifier: string }> }) {
    const { identifier } = await params;
    const postData = await prisma.posts.findFirst({
        where: {
            id: identifier
        }
    })

    const processor = unified()
        .use(rehypeParse, { fragment: true })
        .use(rehypeReact, { Fragment: Fragment, jsx: jsx, jsxs: jsxs, components: componentMap });

    const content = processor.processSync(postData?.blogContent || "<p>No content available.</p>").result;
    return (
        <PageReadySignal>
            <div className="p-6 bg-white/85 contrast:bg-white dark:bg-slate-800/55 dark:contrast:bg-slate-800 shadow">
                <nav aria-label="breadcrumb">
                    <ol className="flex space-x-2 text-sm">
                        <li>
                            <Link href="/v2" className="text-blue-600 dark:text-blue-400 hover:underline">Home</Link>
                        </li>
                        <li>
                            <span className="text-gray-400 dark:text-gray-500">/</span>
                        </li>
                        <li aria-current="page" className="text-gray-700 dark:text-gray-200 font-semibold">
                            {identifier}
                        </li>
                    </ol>
                </nav>
                <Heading className="mt-4 mb-2">{postData?.title}</Heading>
                <Lead>{postData?.description}</Lead>
                <Muted>Published at: {new Date(postData?.datePosted || '').toLocaleString('en')} </Muted>
                <div className="dark:border-b-slate-700 border-b-slate-300 border-b" />
                {content}
                <hr />
                {/* <RecommendedPosts postId={identifier} /> */}
            </div>
        </PageReadySignal>
    )
}