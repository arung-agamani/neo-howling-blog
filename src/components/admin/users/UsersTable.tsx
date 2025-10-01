import React from "react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { UsersTableProps } from "./types";
import { filterUsers } from "./utils";
import UserCard from "./UserCard";

export default function UsersTable({
    users,
    searchTerm,
    filterRole,
}: UsersTableProps) {
    const filteredUsers = filterUsers(users, searchTerm, filterRole);

    return (
        <Card>
            <CardHeader>
                <CardTitle>All Users ({filteredUsers.length})</CardTitle>
                <CardDescription>
                    Showing {filteredUsers.length} of {users.length} users
                </CardDescription>
            </CardHeader>
            <CardContent>
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            No users found
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {searchTerm || filterRole !== "all"
                                ? "Try adjusting your search or filters"
                                : "No users have been created yet"}
                        </p>
                        <Button asChild>
                            <Link href="/admin/main/users/new">
                                <Plus className="w-4 h-4 mr-2" />
                                Create New User
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredUsers.map((user) => (
                            <UserCard key={user.id} user={user} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
