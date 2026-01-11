"use client";

import { MediaLibrary } from "@/components/Dashboard/MediaLibrary";
import { Box } from "@mui/material";

/**
 * Standalone Media Library Page
 * Full-featured media management interface
 */
export default function MediaLibraryPage() {
    return (
        <Box
            sx={{
                height: "calc(100vh - 64px)", // Adjust based on your header/nav height
                display: "flex",
                flexDirection: "column",
            }}
        >
            <MediaLibrary selectionMode="multiple" />
        </Box>
    );
}
