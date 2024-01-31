/* eslint-disable @next/next/no-before-interactive-script-outside-document */
/* eslint-disable @next/next/no-css-tags */
"use client";

import { SessionProvider } from "next-auth/react";
import ReduxProvider from "@/stores/ReduxProvider";
import Script from "next/script";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";
import ThemeRegistry from "./main/ThemeRegistry";
import QueryProviders from "@/hooks/providers";

export default function PostLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html>
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/a11y-dark.min.css"
                />
                <link
                    rel="shortcut icon"
                    href="/favicon.png"
                    type="image/png"
                />
                <Script
                    strategy="beforeInteractive"
                    src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"
                ></Script>
            </head>
            <body className="">
                <ToastContainer autoClose={3000} pauseOnFocusLoss={false} />
                <SessionProvider>
                    <ThemeRegistry options={{ key: "mui" }}>
                        <QueryProviders>
                            <ReduxProvider>{children}</ReduxProvider>
                        </QueryProviders>
                    </ThemeRegistry>
                </SessionProvider>
            </body>
        </html>
    );
}
