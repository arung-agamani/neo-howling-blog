"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

/**
 * @deprecated This page has been consolidated into the main posts page.
 * Users will be automatically redirected to /dashboard/main/posts with the draft filter applied.
 */
export default function DraftPostsPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to main posts page with draft filter
        router.push("/dashboard/main/posts");
    }, [router]);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                p: 4,
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    maxWidth: 600,
                    textAlign: "center",
                }}
            >
                <Typography variant="h5" gutterBottom>
                    Redirecting...
                </Typography>
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                >
                    The draft posts page has been consolidated into the main
                    posts page. You can now filter posts by status (Draft,
                    Published, Trash) from a single location.
                </Typography>
                <CircularProgress />
            </Paper>
        </Box>
    );
}
