import Link from "next/link";
import Script from "next/script";

export default function PostLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="mx-auto max-w-screen-sm lg:max-w-screen-lg flex flex-col">
            {children}
            <Link href={"/"}>
                <div className="bg-blue-700 text-slate-200 py-4">
                    <p className="text-4xl text-center">Back to Home</p>
                </div>
            </Link>
        </div>
    );
}
