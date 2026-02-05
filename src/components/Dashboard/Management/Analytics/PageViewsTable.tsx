import {
    Paper,
    Typography,
    Box,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Tooltip,
} from "@mui/material";
import { formatNumber } from "./utils";

export interface PageData {
    path: string;
    views: number;
    rank: number;
    percentage: string;
}

export interface PageViewsTableProps {
    data: PageData[];
    loading?: boolean;
}

export function PageViewsTable({ data, loading }: PageViewsTableProps) {
    return (
        <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Page Views by Page
            </Typography>
            {loading ? (
                <Box>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton
                            key={i}
                            variant="rectangular"
                            height={48}
                            sx={{ mb: 1 }}
                        />
                    ))}
                </Box>
            ) : data.length === 0 ? (
                <Typography color="text.secondary">
                    No page data available
                </Typography>
            ) : (
                <TableContainer sx={{ maxHeight: 440 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>
                                    Page Path
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                    Views
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>
                                    Share
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.map((page) => (
                                <TableRow
                                    key={page.path}
                                    hover
                                    sx={{
                                        "&:last-child td, &:last-child th": {
                                            border: 0,
                                        },
                                    }}
                                >
                                    <TableCell>
                                        <Chip
                                            label={page.rank}
                                            size="small"
                                            color={
                                                page.rank <= 3
                                                    ? "primary"
                                                    : "default"
                                            }
                                            sx={{ minWidth: 32 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip
                                            title={decodeURIComponent(page.path)}
                                        >
                                            <Typography
                                                variant="body2"
                                                component="a"
                                                href={page.path}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{
                                                    maxWidth: 300,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    display: "block",
                                                    color: "primary.main",
                                                    textDecoration: "none",
                                                    cursor: "pointer",
                                                    "&:hover": {
                                                        textDecoration:
                                                            "underline",
                                                    },
                                                }}
                                            >
                                                {decodeURIComponent(page.path)}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                        >
                                            {formatNumber(page.views)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {page.percentage}%
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Paper>
    );
}
