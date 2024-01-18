import Link from "next/link";
import DarkModeToggle from "./DarkModeToggle";

function TabLink({ label, target }: { label: string; target: string }) {
    return (
        <Link
            href={target}
            className="cursor-pointer text-gray-200 hover:text-white"
        >
            {label}
        </Link>
    );
}

export default function Navbar() {
    return (
        <header className="sticky top-0 bg-[#000B] text-white py-2 w-full">
            <div className="container mx-auto w-full max-w-sm lg:max-w-4xl">
                <div className="flex w-full ">
                    <DarkModeToggle />
                    <div className="hidden lg:flex text-3xl">
                        <TabLink target="/" label="Howling Blog" />
                    </div>
                    {/* <span className="flex-grow"></span> */}
                    <div className="w-full max-w-xl flex justify-evenly">
                        <div>
                            <TabLink target="/page/1" label="Posts" />
                        </div>
                        <div>
                            <TabLink target="#" label="Tags" />
                        </div>
                        <div>
                            <TabLink target="#" label="Snippets" />
                        </div>
                    </div>
                    {/* <span className="flex-grow"></span> */}
                    <div className="ml-auto hidden lg:block">
                        <TabLink target="/dashboard" label="Login" />
                    </div>
                </div>
            </div>
        </header>
    );
}
