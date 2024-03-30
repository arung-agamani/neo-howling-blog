"use client"

import { Divider, IconButton, Paper, Typography } from '@mui/material'
import Link from 'next/link'
import React from 'react'
import AddIcon from "@mui/icons-material/AddBox";
import { useQuery } from "@tanstack/react-query";
import axios from "@/utils/axios";

interface SnippetListItem {
    id: string;
    title: string;
    owner: {
        id: string,
        username: string
    };
    datePosted: string
}


const SnippetsPage = () => {
    const { data } = useQuery({
        queryKey: ["snippets"],
        queryFn: async () => {
            const { data } = await axios.get("/api/dashboardv2/snippet/list")
            return data as SnippetListItem[]
        },
        initialData: []
    })
    return (
        <Paper className='px-4 py-2 w-full h-full'>
            <Typography variant='h4'>Snippets</Typography>
            <Divider />
            <div className="py-4">
                <Link href="/dashboard/main/snippets/edit">
                    <Paper elevation={3}>
                        <div className="p-4 flex">
                            <IconButton>
                                <AddIcon />
                            </IconButton>
                            <Typography variant='h4' color="text.primary">
                                New Snippet
                            </Typography>
                        </div>
                    </Paper>
                </Link>
            </div>
            <div>
                {/* eslint-disable-next-line react/jsx-key */}
                {data?.map((snippet) => (<div>
                    {snippet.title}
                </div>))}
            </div>
        </Paper>
    )
}

export default SnippetsPage