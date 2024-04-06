import React from "react";
import prisma from "@/utils/prisma";
import Link from "next/link";

export const revalidate = 0;

async function SnippetMainPage() {
    const snippets = await prisma.snippet.findMany({
        orderBy: {
            datePosted: "desc",
        },
    });

    return (
        <div className="bg-slate-600 dark:bg-gray-900 pt-2 flex flex-col justify-center max-w-lg lg:max-w-none mx-auto pb-12 lg:px-16">
            <p className="text-3xl lg:text-5xl text-white px-2 mb-4 font-thin lg:text-left text-center self-center">
                Snippets
            </p>
            <div className="flex">
                <div className="flex flex-col flex-grow mx-auto">
                    {snippets.length > 0 &&
                        snippets.map((s) => (
                            <Link href={`/snippet/${s.slug}`} key={s.id}>
                                <div className="pb-4 mx-auto mb-4 bg-white dark:bg-slate-800 lg:rounded-lg shadow w-full flex flex-col">
                                    <p className="text-black dark:text-gray-50 text-2xl lg:text-4xl font-bold px-8 mt-4">
                                        {s.title}
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300 px-8 py-2 text-lg lg:text-xl font-light">
                                        {s.description}
                                    </p>
                                </div>
                            </Link>
                        ))}
                </div>
            </div>
        </div>
    );
}

export default SnippetMainPage;
