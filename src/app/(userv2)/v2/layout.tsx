import React, { PropsWithChildren } from "react";
import { Blockquote, Heading, Lead, Link } from "@/components/Typography";
import DarkModeToggler from "@/components/UserPageV2/DarkModeToggler";
import GithubCard from "@/components/UserPageV2/GithubCard";
import TopDivWrapper from "@/components/UserPageV2/TopDivWrapper";
import { PageViewTracker } from "@/hooks/usePageView";

import "./globals.css";
import "./user-style.css";
import { Provider } from "./ThemeProvider";
import { JotaiProvider } from "@/components/UserPageV2/JotaiProvider";
import BapakBapak from "@/components/UserPageV2/BapakBapak";
import NextLink from "next/link";
import MainContentWrapper from "./MainContentWrapper";
interface Props {}

export const metadata = {
    title: "Howling Blog",
    icons: {
        icon: "/favicon.png",
    },
};

const V2Layout: React.FC<PropsWithChildren<Props>> = ({ children }) => {
    return (
        <html suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Klee+One&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <Provider>
                    <PageViewTracker />
                    <JotaiProvider>
                        <TopDivWrapper>
                            <div className="bg-orange-950/50 min-h-screen w-full mx-auto">
                                <div
                                    id="header"
                                    className="mx-auto container pt-4 px-2 sm:px-0"
                                >
                                    <NextLink
                                        className="no-underline"
                                        href="/v2"
                                    >
                                        <Heading className="text-white text-center sm:text-left">
                                            Howling Blog --Reborn--
                                        </Heading>
                                    </NextLink>
                                    <Lead className="mt-2 text-white mb-8 text-center sm:text-left">
                                        The more ✨kawaii✨ edition, UwU
                                    </Lead>
                                </div>
                                <div className="flex mx-auto gap-x-2 max-w-[1536px]">
                                    <div className="flex-[3] flex-col mx-auto">
                                        <MainContentWrapper>
                                            {children}
                                        </MainContentWrapper>
                                    </div>
                                    <div className="hidden lg:flex flex-[1] max-w-lg bg-white/70 contrast:bg-white dark:bg-slate-800/30 dark:contrast:bg-slate-800 p-4">
                                        <div className="sticky top-[15%]">
                                            <Heading
                                                level={6}
                                                className="mt-2 border-b-2 border-slate-800 dark:border-white"
                                            >
                                                Which Team Are You?
                                            </Heading>
                                            <DarkModeToggler />
                                            <Heading
                                                level={6}
                                                className="mt-2 border-b-2 border-slate-800 dark:border-white"
                                            >
                                                (Indonesian) Bapak-Bapak Joke
                                            </Heading>
                                            <BapakBapak />
                                            <Heading
                                                level={6}
                                                className="mt-2 border-b-0 border-slate-800 dark:border-white"
                                            >
                                                Github
                                            </Heading>
                                            <GithubCard />
                                            <Heading
                                                level={6}
                                                className="mt-2 border-b-2 border-slate-800 dark:border-white"
                                            >
                                                Uninteresting Fact
                                            </Heading>
                                            <Blockquote className="mt-2">
                                                This blog is made with Next.js,
                                                TailwindCSS, Prisma, and
                                                currently hosted in Vercel. The
                                                source code is available on{" "}
                                                <Link
                                                    href="https://github.com/arung-agamani/neo-howling-blog"
                                                    external
                                                >
                                                    GitHub
                                                </Link>
                                                .
                                            </Blockquote>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TopDivWrapper>
                    </JotaiProvider>
                </Provider>
            </body>
        </html>
    );
};

export default V2Layout;
