import PostContainer from "@/components/PostContainer";
import { GetSnippet, GetSnippetBySlug } from "@/lib/Snippet";
import { remark } from "remark";
import html from "remark-html";
import fm from "front-matter";

export const dynamic = "force-dynamic";

interface Params {
    slug: string;
}

import "../../post/[id]/code-block.css";
import "../../post/[id]/github-markdown.css";
import { Metadata } from "next";

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
            url: `https://blog.howlingmoon.dev/snippet/${params.slug}`,
            type: "article",
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
    const processedHtml = await (
        await remark().use(html).process(bodyOnly.body)
    ).toString();

    return (
        <div className="container mx-auto max-lg bg-white dark:bg-slate-900 px-4 pt-4 overflow-hidden rounded-b-2xl transition-colors duration-200">
            <PostContainer content={processedHtml} />
        </div>
    );
}
