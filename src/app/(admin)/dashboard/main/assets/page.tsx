"use client";

import { Card, CardContent, Divider, Typography } from "@mui/material";
import Link from "next/link";

const AssetsPage = () => {
    return (
        <div className="bg-white p-4 w-full h-full">
            <Typography variant="h4">Assets</Typography>
            <Divider />
            <div className="py-4 gap-2 flex flex-col">
                <Link href={"assets/browser"}>
                    <Card
                        sx={{
                            ":hover": {
                                boxShadow: 10,
                            },
                        }}
                    >
                        <CardContent>
                            <Typography variant="h4">Browser</Typography>
                            <Typography variant="body2">
                                Browse, Upload, Rename, and Delete Assets
                            </Typography>
                        </CardContent>
                    </Card>
                </Link>
                <Link href={"assets/ogimage"}>
                    <Card
                        sx={{
                            ":hover": {
                                boxShadow: 10,
                            },
                        }}
                    >
                        <CardContent>
                            <Typography variant="h4">
                                OpenGraph Image Generation
                            </Typography>
                            <Typography variant="body2">
                                Generate Image for Post Header/OG Images
                            </Typography>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
};

export default AssetsPage;
