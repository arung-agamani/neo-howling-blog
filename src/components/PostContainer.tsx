"use client";

import { useTheme } from "next-themes";
import React from "react";

interface Props {
    content: string;
}

const PostContainer: React.FC<Props> = ({ content }) => {
    const { theme } = useTheme();
    return (
        <div
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: content }}
            className={`mx-2 p-4 lg:mx-10 mt-10 font-sans font-normal markdown-body ${
                theme === "dark" ? "mark-dark" : ""
            } bg-white dark:bg-slate-900`}
        />
    );
};

export default PostContainer;
