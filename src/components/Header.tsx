"use client";

import Link from "next/link";
import React from "react";

const Header = () => {
    return (
        <Link href={"/"}>
            <div className="container">
                <div
                    style={{
                        backgroundImage:
                            'url("https://blog.howlingmoon.dev/images/main-page-header-cropped.jpg")',
                        height: "auto",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "cover",
                        backgroundPosition: "center center",
                        aspectRatio: "10/2",
                    }}
                    className="w-screen flex justify-center align-middle h-full py-16"
                >
                    <div
                        className="w-screen h-auto flex justify-center align-middle"
                        style={{
                            backgroundColor: "rgb(0.0, 0.0, 0.0, 0.3)",
                        }}
                    >
                        <div className="flex flex-col justify-center items-center">
                            <p className="text-center text-white text-4xl font-semibold">
                                Howling Blog
                            </p>
                            <p className="text-gray-200 font-thin">
                                <i>
                                    Lingering echoes through the starry night...
                                </i>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default Header;
