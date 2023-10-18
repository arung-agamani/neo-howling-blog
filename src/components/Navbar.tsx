import Link from "next/link";

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
            <div className="container mx-auto w-full max-w-5xl">
                <ul className="flex w-full align-text-bottom leading-loose">
                    <li className="text-2xl">
                        <TabLink target="/" label="Howling Blog" />
                    </li>
                    {/* <span className="flex-grow"></span> */}
                    <ul className="w-full max-w-xl flex justify-evenly">
                        <li>
                            <TabLink target="/page/1" label="Posts" />
                        </li>
                        <li>
                            <TabLink target="#" label="Tags" />
                        </li>
                        <li>
                            <TabLink target="#" label="Snippets" />
                        </li>
                    </ul>
                    {/* <span className="flex-grow"></span> */}
                    <li className="ml-auto">
                        <TabLink target="/dashboard" label="Login" />
                    </li>
                </ul>
            </div>
        </header>
    );
}
