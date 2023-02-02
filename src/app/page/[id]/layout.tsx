import Link from "next/link";
import Script from "next/script";

export default function PostLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="mx-auto max-w-screen-sm lg:max-w-screen-lg">
            {children}
        </div>
    );
}
