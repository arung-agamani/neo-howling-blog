// "use client";
import Link from "next/link";

export const dynamic = "force-dynamic";
export default function PostLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="mx-auto max-w-screen-sm lg:max-w-screen-lg flex flex-col">
            <link
                rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/a11y-dark.min.css"
            />
            {children}
            <Link href={"/"}>
                <div className="bg-blue-700 text-slate-200 py-4">
                    <p className="text-4xl text-center">Back to Home</p>
                </div>
            </Link>
        </div>
    );
}
