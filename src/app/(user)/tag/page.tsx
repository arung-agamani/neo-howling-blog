import Link from "next/link";

export default function Page() {
    return (
        <>
            <h1>This is a page section</h1>
            <Link href={"/"}>
                <p>Back to home</p>
            </Link>
        </>
    );
}
