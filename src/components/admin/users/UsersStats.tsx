import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Shield, Edit, Eye, Mail, Phone } from "lucide-react";
import { UsersStatsProps } from "./types";
import { calculateUserStats, getRoleColor } from "./utils";

export default function UsersStats({ users }: UsersStatsProps) {
    const stats = calculateUserStats(users);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Total Users</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Shield className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Admins</p>
                            <p className="text-2xl font-bold">{stats.admins}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Edit className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Editors</p>
                            <p className="text-2xl font-bold">{stats.editors}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Users className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Users</p>
                            <p className="text-2xl font-bold">{stats.users}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Mail className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">With Email</p>
                            <p className="text-2xl font-bold">{stats.withEmail}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Phone className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">With Phone</p>
                            <p className="text-2xl font-bold">{stats.withPhone}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
