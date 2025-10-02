"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import ConfigManagement from "@/components/admin/settings/ConfigManagement";

export default function SettingsPage() {
    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your application settings and configuration.
                </p>
            </div>

            <Tabs defaultValue="config" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="config">Configuration</TabsTrigger>
                    <TabsTrigger value="general" disabled>
                        General Settings
                    </TabsTrigger>
                    <TabsTrigger value="security" disabled>
                        Security
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="config" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration Management</CardTitle>
                            <CardDescription>
                                View and manage application configuration
                                settings. These are key-value pairs that control
                                various aspects of your application.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ConfigManagement />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>
                                Configure general application settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Coming soon...
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>
                                Manage security and authentication settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Coming soon...
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
