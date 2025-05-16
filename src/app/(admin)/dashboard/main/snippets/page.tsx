"use client";

import {
    Paper,
    Typography,
    Divider,
    IconButton,
    Tooltip,
    Box,
    Button,
    List,
    ListItem,
    ListItemText,
} from "@mui/material";
import Link from "next/link";
import React from "react";
import AddIcon from "@mui/icons-material/AddBox";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "@/utils/axios";
import { deleteSnippet } from "@/lib/server-actions/Snippet";
import { toast } from "react-toastify";

interface SnippetListItem {
    id: string;
    title: string;
    description: string;
    owner: {
        id: string;
        username: string;
    };
    datePosted: string;
    slug: string;
}

const SnippetsPage = () => {
    const queryClient = useQueryClient();
    const { data } = useQuery({
        queryKey: ["snippets"],
        queryFn: async () => {
            const { data } = await axios.get("/api/dashboardv2/snippet/list");
            return data as SnippetListItem[];
        },
        initialData: [],
    });

    const deleteHandler = async (id: string) => {
        const res = await deleteSnippet(id);
        if (!res.success) toast.error(res.message);
        else toast.success(res.message);
        queryClient.refetchQueries({
            queryKey: ["snippets"],
        });
    };

    return (
        <Paper className="px-4 py-4 w-full h-full">
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                }}
            >
                <Typography variant="h4">Snippets</Typography>
                <Link href="/dashboard/main/snippets/edit">
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        size="small"
                    >
                        New Snippet
                    </Button>
                </Link>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List>
                {data.length === 0 ? (
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        No snippets found.
                    </Typography>
                ) : (
                    data.map((snippet) => (
                        <ListItem
                            key={snippet.id}
                            alignItems="flex-start"
                            sx={{
                                borderRadius: 2,
                                boxShadow: 1,
                                bgcolor: "#fafbff",
                                mb: 2,
                                px: 2,
                                py: 2,
                                border: "1px solid #e3e6f0",
                                transition:
                                    "box-shadow 0.2s, border-color 0.2s",
                                "&:hover": {
                                    boxShadow: 4,
                                    borderColor: "#1976d2",
                                    bgcolor: "#f0f7ff",
                                },
                                display: "flex",
                                alignItems: "flex-start",
                            }}
                            secondaryAction={
                                <Box>
                                    <Tooltip title="View this snippet">
                                        <IconButton
                                            component={Link}
                                            href={`/snippet/${snippet.slug}`}
                                            size="small"
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Edit this snippet">
                                        <IconButton
                                            component={Link}
                                            href={{
                                                pathname:
                                                    "/dashboard/main/snippets/edit",
                                                query: { id: snippet.id },
                                            }}
                                            size="small"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete this snippet">
                                        <IconButton
                                            onClick={() =>
                                                deleteHandler(snippet.id)
                                            }
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            }
                        >
                            <ListItemText
                                primary={
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={600}
                                            sx={{
                                                color: "#1976d2",
                                                fontSize: 18,
                                            }}
                                        >
                                            {snippet.title}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ ml: 1 }}
                                        >
                                            by {snippet.owner.username} •{" "}
                                            {new Date(
                                                snippet.datePosted
                                            ).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                }
                                secondary={
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ mt: 0.5 }}
                                    >
                                        {snippet.description ||
                                            "No descriptions available"}
                                    </Typography>
                                }
                            />
                        </ListItem>
                    ))
                )}
            </List>
        </Paper>
    );
};

export default SnippetsPage;
