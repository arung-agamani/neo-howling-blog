import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Mail, Phone, Calendar, User } from "lucide-react";
import { UserCardProps } from "./types";
import {
    formatDate,
    formatPhoneNumber,
    getDisplayName,
    getEmailDisplayText,
    getRoleBadgeVariant,
    capitalizeRole,
    getGenderDisplayText
} from "./utils";

export default function UserCard({ user }: UserCardProps) {
    return (
        <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {getDisplayName(user).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">
                                    {getDisplayName(user)}
                                </h3>
                                <Badge variant={getRoleBadgeVariant(user.role)}>
                                    {capitalizeRole(user.role)}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                @{user.username}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">
                                {getEmailDisplayText(user.email)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            <span>
                                {formatPhoneNumber(user.phone)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>
                                Birthday: {formatDate(user.birthday)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <span>
                                {getGenderDisplayText(user.gender)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                    >
                        <Link href={`/admin/main/users/${user.id}`}>
                            <Eye className="w-4 h-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                    >
                        <Link href={`/admin/main/users/${user.id}/edit`}>
                            <Edit className="w-4 h-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
