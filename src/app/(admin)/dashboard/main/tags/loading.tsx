import { Box, Skeleton, Paper, Divider } from "@mui/material";

export default function Loading() {
    return (
        <Box
            sx={{
                bgcolor: "background.paper",
                minHeight: "100%",
                p: 3,
            }}
        >
            {/* Header skeleton */}
            <Box sx={{ mb: 3 }}>
                <Skeleton variant="text" width={250} height={45} />
                <Skeleton variant="text" width={400} height={24} />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Stats Bar skeleton */}
            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    mb: 3,
                }}
            >
                {[1, 2, 3].map((i) => (
                    <Skeleton
                        key={i}
                        variant="rounded"
                        width={160}
                        height={72}
                        sx={{ borderRadius: 2 }}
                    />
                ))}
            </Box>

            {/* Top tags skeleton */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <Skeleton variant="text" width={40} height={24} />
                {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton
                        key={i}
                        variant="rounded"
                        width={80}
                        height={24}
                        sx={{ borderRadius: 12 }}
                    />
                ))}
            </Box>

            {/* Filter Bar skeleton */}
            <Box sx={{ mb: 3 }}>
                {/* Action buttons row */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                    }}
                >
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Skeleton variant="rounded" width={100} height={36} />
                        <Skeleton variant="rounded" width={90} height={36} />
                        <Skeleton variant="rounded" width={110} height={36} />
                    </Box>
                    <Skeleton variant="rounded" width={80} height={36} />
                </Box>

                {/* Filter inputs row */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "1fr 1fr",
                            md: "2fr 1fr 1fr 1fr",
                        },
                        gap: 2,
                    }}
                >
                    <Skeleton variant="rounded" height={40} />
                    <Skeleton variant="rounded" height={40} />
                    <Skeleton variant="rounded" height={40} />
                    <Skeleton variant="rounded" height={40} />
                </Box>
            </Box>

            {/* Table skeleton */}
            <Paper
                elevation={0}
                sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    overflow: "hidden",
                }}
            >
                {/* Table header */}
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "48px 1fr 100px 200px 180px 100px",
                        gap: 2,
                        p: 2,
                        bgcolor: "grey.50",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Skeleton variant="rounded" width={24} height={24} />
                    <Skeleton variant="text" width={80} height={24} />
                    <Skeleton variant="text" width={50} height={24} />
                    <Skeleton variant="text" width={90} height={24} />
                    <Skeleton variant="text" width={60} height={24} />
                    <Skeleton variant="text" width={60} height={24} />
                </Box>

                {/* Table rows */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <Box
                        key={i}
                        sx={{
                            display: "grid",
                            gridTemplateColumns:
                                "48px 1fr 100px 200px 180px 100px",
                            gap: 2,
                            p: 2,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            "&:last-child": {
                                borderBottom: "none",
                            },
                        }}
                    >
                        <Skeleton variant="rounded" width={24} height={24} />
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            <Skeleton
                                variant="circular"
                                width={16}
                                height={16}
                            />
                            <Skeleton variant="text" width={100} height={24} />
                        </Box>
                        <Skeleton
                            variant="rounded"
                            width={50}
                            height={24}
                            sx={{ borderRadius: 12 }}
                        />
                        <Skeleton variant="text" width="80%" height={24} />
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Skeleton
                                variant="rounded"
                                width={40}
                                height={20}
                            />
                            <Skeleton
                                variant="rounded"
                                width={40}
                                height={20}
                            />
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Skeleton
                                variant="circular"
                                width={28}
                                height={28}
                            />
                            <Skeleton
                                variant="circular"
                                width={28}
                                height={28}
                            />
                        </Box>
                    </Box>
                ))}

                {/* Pagination skeleton */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 2,
                        p: 2,
                        borderTop: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Skeleton variant="text" width={120} height={24} />
                    <Skeleton variant="rounded" width={100} height={32} />
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton
                                key={i}
                                variant="rounded"
                                width={32}
                                height={32}
                            />
                        ))}
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}
