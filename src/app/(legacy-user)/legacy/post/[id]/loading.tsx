import HomeButton from "@/components/HomeButton";
import ScrollTop from "@/components/ScrollTop";
import "./post.css";

export default function Loading() {
    return (
        <div className="post container mx-auto max-lg bg-white px-4 pt-4 overflow-hidden min-h-screen">
            <h1 className=" text-3xl mx-8 pt-4">Loading...</h1>
            <p className="mx-8 my-4">Loading awesome content...</p>
            <hr />
            <hr className="my-4" />
            <div className="mx-2 lg:mx-10 mt-10 font-sans font-normal">
                <h1>There will be awesome contents here</h1>
            </div>
            <div className="floating-container flex gap-3">
                <HomeButton />
                <ScrollTop />
            </div>
        </div>
    );
}
