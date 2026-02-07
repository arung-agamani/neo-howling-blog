"use client";

import { Card, CardContent, Divider, Typography } from "@mui/material";
import Link from "next/link";

const ManagementPage = () => {
    return (
        <div className="bg-white p-4 w-full h-full">
            <Typography variant="h4">Management</Typography>
            <Divider />
            <div className="py-4 gap-2 flex flex-col">
                <Link href={"management/config"}>
                    <Card
                        sx={{
                            ":hover": {
                                boxShadow: 10,
                            },
                        }}
                    >
                        <CardContent>
                            <Typography variant="h4">
                                Global Configuration
                            </Typography>
                            <Typography variant="body2">
                                Control parameters that change how the CMS
                                behave
                            </Typography>
                        </CardContent>
                    </Card>
                </Link>
                <Link href={"management/users"}>
                    <Card
                        sx={{
                            ":hover": {
                                boxShadow: 10,
                            },
                        }}
                    >
                        <CardContent>
                            <Typography variant="h4">
                                User Management
                            </Typography>
                            <Typography variant="body2">
                                Manage Users
                            </Typography>
                        </CardContent>
                    </Card>
                </Link>
                <Link href={"management/analytics"}>
                    <Card
                        sx={{
                            ":hover": {
                                boxShadow: 10,
                            },
                        }}
                    >
                        <CardContent>
                            <Typography variant="h4">Analytics</Typography>
                            <Typography variant="body2">
                                Detailed site traffic and visitor insights
                            </Typography>
                        </CardContent>
                    </Card>
                </Link>
                <Link href={"management/api-keys"}>
                    <Card
                        sx={{
                            ":hover": {
                                boxShadow: 10,
                            },
                        }}
                    >
                        <CardContent>
                            <Typography variant="h4">API Keys</Typography>
                            <Typography variant="body2">
                                Manage API keys for programmatic access to the
                                v2 API
                            </Typography>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
};

export default ManagementPage;
