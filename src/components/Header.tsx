"use client";

import Link from "next/link";
import React from "react";

const Header = () => {
    return (
        <Link href={"/"}>
            <div className="">
                <div
                    style={{
                        backgroundImage:
                            'url("https://blog.howlingmoon.dev/images/main-page-header-cropped.jpg")',
                        height: "auto",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "cover",
                        backgroundPosition: "center center",
                        aspectRatio: "10/3",
                    }}
                    className="flex justify-center align-middle h-full"
                >
                    <div
                        className="w-screen h-auto flex justify-center align-middle"
                        style={{
                            backgroundColor: "rgb(0.0, 0.0, 0.0, 0.3)",
                            aspectRatio: "10/3",
                        }}
                    >
                        <div className="flex flex-col justify-center items-center">
                            <p
                                className="text-center text-white text-2xl sm:text-6xl pt-0 sm:pt-20 font-semibold"
                                // style={{
                                //     letterSpacing: "0.5rem",
                                // }}
                            >
                                Howling Blog
                            </p>
                            <p className="text-center text-gray-200 font-thin text-sm sm:text-xl pt-2">
                                <i>
                                    Lingering echoes through the{" "}
                                    <span>
                                        <Link href={"/dashboard"}>starry</Link>
                                    </span>{" "}
                                    night...
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
