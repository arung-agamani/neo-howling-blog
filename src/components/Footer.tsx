"use client";

import React from "react";

const Footer = () => {
    return (
        <div
            className="bg-black flex flex-col w-full mx-auto text-gray-300 py-8 px-4 lg:px-16
            
        "
        >
            <div className="pb-8 text-center ">
                <p className="text-4xl">Howling Blog</p>
                <p className="text-2xl">Part of Howling Moon Dev.</p>
                <div className="sm:pt-0 pt-12">
                    <p>Built with Nextjs 13</p>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center align-top">
                <div className="mr-2 text-center ">
                    <p>For further inquiries</p>
                    <br />
                    <a
                        href="mailto:arung.agamani@gmail.com"
                        className="text-blue-600 hover:text-blue-100"
                    >
                        E-mail
                    </a>
                    <br />
                    <a
                        href="https://github.com/arung-agamani"
                        className="text-blue-600 hover:text-blue-100"
                    >
                        Github
                    </a>
                    <br />
                    <a
                        href="https://www.linkedin.com/in/arungagamani/"
                        className="text-blue-600 hover:text-blue-100"
                    >
                        LinkedIn
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Footer;
