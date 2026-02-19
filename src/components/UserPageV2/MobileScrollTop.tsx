"use client";

import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const MobileScrollTop = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setVisible(window.scrollY > 300);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed bottom-24 right-6 z-50 lg:hidden">
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-orange-900 dark:bg-slate-700 text-white shadow-lg hover:bg-orange-800 dark:hover:bg-slate-600 active:scale-95 transition-transform"
                aria-label="Scroll to top"
            >
                <ArrowUp className="w-6 h-6" />
            </button>
        </div>
    );
};

export default MobileScrollTop;
