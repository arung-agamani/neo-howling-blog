import Link from "next/link";

interface PostResult {
    params: {
        id: string;
        title: string;
        desc: string;
        datePosted: string;
        bannerUrl: string;
        link: string;
    };
}

async function getPosts(): Promise<[PostResult[] | null, null | string]> {
    const res = await fetch(
        "https://blog.howlingmoon.dev/api/postsHeader?page=1"
    );
    if (!res.ok) return [null, "Error happened"];
    const jsonRes = (await res.json()) as PostResult[];
    return [jsonRes, null];
}

export default async function Page() {
    const [posts, err] = await getPosts();
    return (
        <div className="bg-gray-700 pt-2 flex flex-col lg:flex-row justify-center max-w-lg lg:max-w-none mx-auto pb-12 lg:px-16">
            <div className="flex flex-col">
                <p className="text-5xl text-white px-2 mb-4 font-thin">
                    Recent Posts
                </p>
                {posts &&
                    posts.map((x) => (
                        <Link
                            href={`page/${x.params.id}`}
                            key={x.params.id}
                            className="w-full"
                        >
                            <div
                                className="pb-4 mx-auto my-2 bg-white rounded-lg 
                            shadow w-full flex flex-col"
                            >
                                <img
                                    src={x.params.bannerUrl}
                                    alt="This post's banner image"
                                    className="rounded-t-lg w-full h-auto"
                                />
                                <p className="uppercase font-bold text-orange-500 px-8 pt-4">
                                    {["javascript", "tech"].join(" ")}
                                </p>
                                <p className="text-black text-4xl font-bold px-8 mt-4">
                                    {x.params.title}
                                </p>
                                <p className="text-gray-700 px-8 py-8 text-xl font-light">
                                    {x.params.desc}
                                </p>
                            </div>
                        </Link>
                    ))}
            </div>
            <div
                className="bg-white mt-12 ml-8 rounded-t-lg pb-8 w-full h-full lg:flex lg:flex-col justify-center align-top max-w-lg
                hidden 
            "
            >
                <p className="text-3xl font-semibold text-center mb-2">
                    Good Stuff
                </p>
                {[1, 2, 3].map((x) => (
                    <div
                        key={x}
                        className="mx-2 mb-2 px-2 py-2 border-2 border-dashed rounded-md border-black bg-slate-300"
                    >
                        <p className="text-2xl font-semibold">Item {x}</p>
                        <p className="text-lg font-light">
                            A neat description of item {x}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
