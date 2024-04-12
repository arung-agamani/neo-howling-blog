import PostContainer from "@/components/PostContainer";
import { GetSnippet, GetSnippetBySlug } from "@/lib/Snippet";
import { remark } from "remark";
import html from "remark-html";
import fm from "front-matter";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeHightlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

export const dynamic = "force-dynamic";

interface Params {
    slug: string;
}

import "../../post/[id]/code-block.css";
import "../../post/[id]/github-markdown.css";
import { Metadata } from "next";

const processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeHightlight)
    .use(rehypeStringify);

export async function generateMetadata({ params }: { params: Params }) {
    const data = await GetSnippetBySlug(params.slug);
    if (!data)
        return {
            title: "404 Not Found",
            description: "Snippets not found",
        } satisfies Metadata;

    return {
        title: data.title,
        description: data.description,
        metadataBase: new URL("https://blog.howlingmoon.dev"),
        openGraph: {
            title: data.title,
            description: data.description,
            url: `/snippet/${params.slug}`,
            type: "article",
            images: [
                {
                    url: `/api/og-snippet?title=${encodeURIComponent(data.title)}&description=${encodeURIComponent(data.description)}&author=${encodeURIComponent(data.owner.username)}`,
                },
            ],
        },
    } satisfies Metadata;
}

export default async function Page({ params }: { params: Params }) {
    const data = await GetSnippetBySlug(params.slug);
    if (!data)
        return (
            <div className="container mx-auto max-lg bg-white dark:bg-slate-900 px-4 pt-4 overflow-hidden rounded-b-2xl transition-colors duration-200">
                <h1 className="text-3xl mx-8 pt-4 text-center">
                    Snippet Not Found
                </h1>
            </div>
        );

    const bodyOnly = fm(data.content);
    // const processedHtml = await (
    //     await remark().use(html).process(bodyOnly.body)
    // ).toString();
    // console.log(bodyOnly.body);

    const processedHtml = processor.processSync(bodyOnly.body);

    return (
        <div className="flex flex-col min-h-screen container mx-auto max-lg bg-white dark:bg-slate-900 px-4 pt-4 overflow-hidden rounded-b-2xl transition-colors duration-200">
            <PostContainer content={String(processedHtml)} />
            <div className="flex-grow"></div>
        </div>
    );
}
