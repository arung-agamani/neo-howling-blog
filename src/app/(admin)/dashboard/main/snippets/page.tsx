"use client";

import {
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Divider,
    IconButton,
    Paper,
    Tooltip,
    Typography,
} from "@mui/material";
import Link from "next/link";
import React from "react";
import AddIcon from "@mui/icons-material/AddBox";
import { useQuery } from "@tanstack/react-query";
import axios from "@/utils/axios";

// Icons
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface SnippetListItem {
    id: string;
    title: string;
    description: string;
    owner: {
        id: string;
        username: string;
    };
    datePosted: string;
}

const SnippetsPage = () => {
    const { data } = useQuery({
        queryKey: ["snippets"],
        queryFn: async () => {
            const { data } = await axios.get("/api/dashboardv2/snippet/list");
            return data as SnippetListItem[];
        },
        initialData: [],
    });
    return (
        <Paper className="px-4 py-2 w-full h-full">
            <Typography variant="h4">Snippets</Typography>
            <Divider />
            <div className="py-4">
                <Link href="/dashboard/main/snippets/edit">
                    <Paper elevation={3}>
                        <div className="p-4 flex">
                            <IconButton>
                                <AddIcon />
                            </IconButton>
                            <Typography variant="h4" color="text.primary">
                                New Snippet
                            </Typography>
                        </div>
                    </Paper>
                </Link>
            </div>
            <div>
                {data?.map((snippet) => (
                    <Card key={snippet.id} elevation={1} className="">
                        <CardHeader
                            title={
                                <div className="flex gap-2">
                                    <div className="flex items-center">
                                        <CalendarMonthIcon />
                                        <Typography
                                            variant="body2"
                                            className="pl-1"
                                        >
                                            {new Date(
                                                snippet.datePosted,
                                            ).toLocaleString()}
                                        </Typography>
                                    </div>
                                    <div className="flex items-center">
                                        <AccountCircleIcon />
                                        <Typography
                                            variant="body2"
                                            className="pl-1"
                                        >
                                            {snippet.owner.username}
                                        </Typography>
                                    </div>
                                </div>
                            }
                        />
                        <CardContent
                            sx={{ paddingTop: "0", paddingBottom: "0" }}
                        >
                            <Typography variant="h4">
                                {snippet.title}
                            </Typography>
                            <Typography
                                variant="body1"
                                className="text-gray-500"
                            >
                                {snippet.description ||
                                    "No descriptions available"}
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Tooltip title="Edit this snippet">
                                <IconButton>
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete this snippet">
                                <IconButton>
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        </CardActions>
                    </Card>
                ))}
            </div>
        </Paper>
    );
};

export default SnippetsPage;
