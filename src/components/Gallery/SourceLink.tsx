"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/utils/index";
import type { PlatformInfo } from "./platforms";
import { isSafeUrl } from "./utils";

interface SourceLinkProps {
    platform: PlatformInfo | null;
    url: string;
}

const FALLBACK_STYLE = {
    label: "Source",
    bg: "bg-white/8",
    text: "text-white/70",
    border: "border-white/15",
    dot: "bg-white/40",
};

export default function SourceLink({ platform, url }: SourceLinkProps) {
    if (!isSafeUrl(url)) return null;

    const p = platform ?? FALLBACK_STYLE;
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                "border transition-all hover:brightness-125 active:scale-95",
                p.bg,
                p.text,
                p.border,
            )}
        >
            <span
                className={cn("w-1.5 h-1.5 rounded-full shrink-0", p.dot)}
            />
            {p.label}
            <ExternalLink className="w-3 h-3 opacity-70" />
        </a>
    );
}
