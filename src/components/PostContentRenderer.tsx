import React from "react";
import {
    Blockquote,
    Heading,
    Text,
} from "@/components/Typography";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeReact from "rehype-react";
interface HtmlProps extends React.HTMLAttributes<HTMLElement> {
    children?: React.ReactNode;
    alt?: string;
    src?: string;
    title?: string;
    allow?: string;
    allowFullScreen?: boolean;
    loading?: "eager" | "lazy";
    referrerPolicy?: React.HTMLAttributeReferrerPolicy;
    width?: number | string;
    height?: number | string;
}

const makeHeading = (level: 1 | 2 | 3 | 4 | 5 | 6 | undefined = 1) => {
    const c: React.FC<HtmlProps> = ({ children }) => {
        return (
            <Heading level={level} className="mt-4 mb-2">
                {children}
            </Heading>
        );
    };
    return c;
};

const CustomParagraph: React.FC<HtmlProps> = ({ children }) => {
    return <Text className="mb-4 leading-relaxed">{children}</Text>;
};

const CustomUnorderedList: React.FC<HtmlProps> = ({ children }) => {
    return (
        <ul
            className="my-6 ml-6 space-y-2 list-disc marker:text-blue-500 dark:marker:text-blue-400
                       text-slate-900 dark:text-slate-100"
        >
            {children}
        </ul>
    );
};

const CustomOrderedList: React.FC<HtmlProps> = ({ children }) => {
    return (
        <ol
            className="my-6 ml-6 space-y-2 list-decimal marker:text-blue-500 dark:marker:text-blue-400
                       marker:font-semibold text-slate-900 dark:text-slate-100"
        >
            {children}
        </ol>
    );
};

const CustomListItem: React.FC<HtmlProps> = ({ children }) => {
    return (
        <li
            className="pl-2 leading-relaxed hover:text-blue-600 dark:hover:text-blue-300
                       transition-colors duration-200"
        >
            {children}
        </li>
    );
};

// Custom blockquote component
const CustomBlockquote: React.FC<HtmlProps> = ({ children }) => {
    return <Blockquote className="my-6">{children}</Blockquote>;
};

type RehypeComponents = Record<string, React.FC<HtmlProps>>;

const componentMap: RehypeComponents = {
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
    img: ({ children, ...props }: HtmlProps) => (
        <img {...props} className="my-4" alt={props.alt ?? "Post image"} />
    ),
    video: ({ children, ...props }: HtmlProps) => (
        <video
            {...props}
            controls
            preload="metadata"
            className="my-6 w-full rounded-lg border bg-black"
        />
    ),
    audio: ({ children, ...props }: HtmlProps) => (
        <audio
            {...props}
            controls
            preload="metadata"
            className="my-4 w-full"
        />
    ),
    iframe: ({ children, width, height, ...props }: HtmlProps) => (
        // Embeds are stored as bare iframes; sizing is handled here so the
        // stored HTML stays minimal and provider-agnostic.
        <div className="my-6 aspect-video w-full overflow-hidden rounded-lg border bg-black">
            <iframe
                {...props}
                allowFullScreen
                loading="lazy"
                className="h-full w-full"
            />
        </div>
    ),
    a: ({ children, ...props }: HtmlProps) => (
        <a
            {...props}
            className="text-blue-600 dark:text-blue-400 hover:underline"
            style={{ overflowWrap: "break-word", wordWrap: "break-word" }}
        >
            {children}
        </a>
    ),
};

const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeReact, {
        Fragment: Fragment,
        jsx: jsx,
        jsxs: jsxs,
        components: componentMap,
    });

interface PostContentRendererProps {
    html: string;
    fallback?: string;
}

/**
 * Shared post body renderer. Same unified/rehype pipeline as
 * PostDetailPage — extract once so the v2 editor preview and the public
 * page can never drift apart.
 */
const PostContentRenderer: React.FC<PostContentRendererProps> = ({
    html,
    fallback = "<p>No content available.</p>",
}) => {
    const content = processor.processSync(html || fallback).result;
    return (
        <div
            className="overflow-hidden"
            style={{
                overflowWrap: "break-word",
                wordWrap: "normal",
            }}
        >
            {content as React.ReactNode}
        </div>
    );
};

export default PostContentRenderer;
