/* eslint-disable @next/next/no-before-interactive-script-outside-document */
/* eslint-disable @next/next/no-css-tags */
"use client";

import Script from "next/script";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

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
                <Script
                    strategy="beforeInteractive"
                    src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"
                ></Script>
            </head>
            <body className="">
                <ToastContainer autoClose={3000} />
                {children}
            </body>
        </html>
    );
}
