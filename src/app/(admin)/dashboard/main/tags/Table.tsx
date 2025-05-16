"use client";

import {
    MaterialReactTable,
    useMaterialReactTable,
} from "material-react-table";
import type { MRT_ColumnDef } from "material-react-table";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListPostsResponse } from "@/lib/Post";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    CircularProgress,
} from "@mui/material";

interface Props {
    tags: Tags[];
}
type Tags = {
    id: string;
    count: number;
    name: string;
    posts: string[];
};

const TagsTable: React.FC<Props> = ({ tags }) => {
    const postsQuery = useQuery({
        queryKey: ["posts"],
        queryFn: async () => {
            const res = await fetch("/api/dashboardv2/post/list");
            const data = (await res.json()) as ListPostsResponse;
            return data;
        },
    });
    const columns = useMemo<MRT_ColumnDef<Tags>[]>(
        () => [
            {
                accessorKey: "name",
                header: "Tag Name",
            },
            {
                accessorKey: "count",
                header: "Count",
            },
        ],
        []
    );

    const table = useMaterialReactTable({
        columns,
        data: tags,
        enableBottomToolbar: false,
        enableTopToolbar: true,
        enableEditing: false,
        initialState: {
            sorting: [{ id: "count", desc: true }],
            expanded: true,
        },
        paginationDisplayMode: "pages",
        renderDetailPanel: ({ row }) => (
            <div className="p-4">
                <Typography variant="h6" gutterBottom>
                    Posts with this tag:
                </Typography>
                {postsQuery.isLoading ? (
                    <CircularProgress />
                ) : row.original.posts.length > 0 ? (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Date Posted</TableCell>
                                    <TableCell>Date Updated</TableCell>
                                    <TableCell>Published</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {row.original.posts
                                    .map((post) => {
                                        const postDetails =
                                            postsQuery.data?.find(
                                                (p) => p.id === post
                                            );
                                        return postDetails;
                                    })
                                    .filter(Boolean)
                                    .sort((a, b) =>
                                        a?.datePosted && b?.datePosted
                                            ? new Date(b.datePosted).getTime() -
                                              new Date(a.datePosted).getTime()
                                            : 0
                                    )
                                    .map((postDetails, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Link
                                                    href={`/dashboard/main/posts/edit?id=${postDetails?.id}`}
                                                    className="text-blue-500 hover:underline"
                                                >
                                                    {postDetails?.title ||
                                                        "Unknown Post"}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                {postDetails?.datePosted
                                                    ? new Date(
                                                          postDetails.datePosted
                                                      ).toLocaleString(
                                                          undefined,
                                                          {
                                                              hour: "2-digit",
                                                              minute: "2-digit",
                                                              second: "2-digit",
                                                          }
                                                      ) +
                                                      " " +
                                                      new Date(
                                                          postDetails.datePosted
                                                      ).toLocaleDateString()
                                                    : "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                {postDetails?.updatedAt
                                                    ? new Date(
                                                          postDetails.updatedAt
                                                      ).toLocaleDateString()
                                                    : "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                {postDetails?.isPublished
                                                    ? "Yes"
                                                    : "No"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Typography color="textSecondary">
                        No posts available
                    </Typography>
                )}
            </div>
        ),
    });

    return <MaterialReactTable table={table} />;
};

export default TagsTable;
