"use client";

import Link from "next/link";
import React from "react";

const Header = () => {
    return (
        <div className="">
            <div
                style={{
                    backgroundImage:
                        'url("https://howling-blog-uploads.s3.ap-southeast-1.amazonaws.com/2023/3/19/main-page-header-cropped.jpg")',
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
                            className="text-center text-white text-2xl sm:text-6xl pt-0 sm:pt-20 font-extralight"
                            // style={{
                            //     letterSpacing: "0.5rem",
                            // }}
                        >
                            星空ノ響き
                        </p>
                        <p className="text-center text-gray-200 font-thin text-sm sm:text-xl pt-2">
                            <i>
                                Lingering echoes through the{" "}
                                <span>
                                    <Link href={"/dashboard"}>
                                        <span>starry</span>
                                    </Link>
                                </span>{" "}
                                night...
                            </i>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
