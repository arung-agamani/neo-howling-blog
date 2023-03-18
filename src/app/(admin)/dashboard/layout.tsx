"use client";

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
            <body className="">
                <ToastContainer autoClose={3000} />
                {children}
            </body>
        </html>
    );
}
