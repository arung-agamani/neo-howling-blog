import { Box, Skeleton, Paper, Breadcrumbs, Typography } from "@mui/material";

export default function TagDetailLoading() {
    return (
        <Box
            sx={{
                bgcolor: "background.paper",
                minHeight: "100%",
                p: 3,
            }}
        >
            {/* Breadcrumbs skeleton */}
            <Breadcrumbs sx={{ mb: 2 }}>
                <Typography color="text.secondary">Tags</Typography>
                <Skeleton width={80} />
            </Breadcrumbs>

            {/* Header skeleton */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 3,
                    flexWrap: "wrap",
                    gap: 2,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box>
                        <Skeleton variant="text" width={200} height={40} />
                        <Skeleton variant="text" width={300} height={24} />
                    </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Skeleton variant="rounded" width={80} height={36} />
                    <Skeleton variant="rounded" width={80} height={36} />
                </Box>
            </Box>

            <Skeleton
                variant="rectangular"
                height={1}
                sx={{ mb: 3, bgcolor: "divider" }}
            />

            {/* Stats and Info Grid skeleton */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 3,
                    mb: 3,
                }}
            >
                {/* Stats Card skeleton */}
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Skeleton variant="text" width={100} height={32} sx={{ mb: 2 }} />
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: 2,
                        }}
                    >
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton
                                key={i}
                                variant="rounded"
                                height={100}
                                sx={{ borderRadius: 1 }}
                            />
                        ))}
                    </Box>
                </Paper>

                {/* Info Card skeleton */}
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Skeleton variant="text" width={120} height={32} sx={{ mb: 2 }} />
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <Box>
                            <Skeleton variant="text" width={40} height={20} />
                            <Skeleton variant="rounded" width={200} height={28} />
                        </Box>
                        <Box>
                            <Skeleton variant="text" width={60} height={20} />
                            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                {[1, 2, 3].map((i) => (
                                    <Skeleton
                                        key={i}
                                        variant="rounded"
                                        width={60}
                                        height={24}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            </Box>

            {/* Posts Table skeleton */}
            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                <Box
                    sx={{
                        p: 2,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Skeleton variant="text" width={200} height={32} />
                </Box>
                <Box sx={{ p: 2 }}>
                    {/* Table header */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr 1fr 80px",
                            gap: 2,
                            mb: 2,
                            pb: 1,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                        }}
                    >
                        {["Title", "Status", "Date", "Tags", "Actions"].map((header) => (
                            <Skeleton key={header} variant="text" width={60} height={20} />
                        ))}
                    </Box>
                    {/* Table rows */}
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Box
                            key={i}
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr 1fr 1fr 80px",
                                gap: 2,
                                py: 1.5,
                                borderBottom: "1px solid",
                                borderColor: "divider",
                            }}
                        >
                            <Skeleton variant="text" width="80%" height={24} />
                            <Skeleton variant="rounded" width={70} height={24} />
                            <Skeleton variant="text" width={80} height={24} />
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                                <Skeleton variant="rounded" width={40} height={20} />
                                <Skeleton variant="rounded" width={40} height={20} />
                            </Box>
                            <Skeleton variant="circular" width={32} height={32} />
                        </Box>
                    ))}
                </Box>
            </Paper>
        </Box>
    );
}
