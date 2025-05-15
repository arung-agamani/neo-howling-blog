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
        enableTopToolbar: false,
        enableEditing: false,
        initialState: {
            sorting: [{ id: "count", desc: true }], // Default sort by count in descending order
            expanded: true, // Set all rows to be expanded by default
        },
        paginationDisplayMode: "pages",
        renderDetailPanel: ({ row }) => (
            <div className="p-4">
                <p className="font-bold">Posts with this tag:</p>
                <ul className="list-disc pl-6">
                    {row.original.posts.length > 0 ? (
                        <table className="table-auto border-collapse border border-gray-300 w-full text-left">
                            <thead>
                                <tr>
                                    <th className="border border-gray-300 px-4 py-2">
                                        Title
                                    </th>
                                    <th className="border border-gray-300 px-4 py-2">
                                        Date Posted
                                    </th>
                                    <th className="border border-gray-300 px-4 py-2">
                                        Date Updated
                                    </th>
                                    <th className="border border-gray-300 px-4 py-2">
                                        Published
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
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
                                        <tr key={index}>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <Link
                                                    href={`/dashboard/main/posts/edit?id=${postDetails?.id}`}
                                                    className="text-blue-500 hover:underline"
                                                >
                                                    {postDetails?.title ||
                                                        "Unknown Post"}
                                                </Link>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
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
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {postDetails?.updatedAt
                                                    ? new Date(
                                                          postDetails.updatedAt
                                                      ).toLocaleDateString()
                                                    : "N/A"}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {postDetails?.isPublished
                                                    ? "Yes"
                                                    : "No"}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-500">No posts available</p>
                    )}
                </ul>
            </div>
        ),
    });

    return <MaterialReactTable table={table} />;
};

export default TagsTable;
