"use client";

import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";

interface Props {
    content: string;
}
// TODO: Find a way to fetch both theme and cache it (currently it fires request on every switch)
const PostContainer: React.FC<Props> = ({ content }) => {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted) return null;
    return (
        <>
            {theme === "dark" ? (
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/a11y-dark.min.css"
                />
            ) : (
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/a11y-light.min.css"
                />
            )}
            <div
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: content }}
                className={`mx-2 p-4 lg:mx-10 mt-10 font-sans font-normal markdown-body transition-colors duration-200 ${
                    theme === "dark" ? "mark-dark" : ""
                } bg-white dark:bg-slate-900`}
            />
        </>
    );
};

export default PostContainer;
