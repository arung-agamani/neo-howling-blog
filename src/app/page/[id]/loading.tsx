"use client";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function Loading() {
    return (
        <>
            <p className="text-4xl text-white font-bold">
                Loading awesome content
            </p>
            <Skeleton />
            <Skeleton count={5} />
        </>
    );
}
