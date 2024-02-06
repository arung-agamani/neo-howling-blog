"use client";
import { updateUser } from "@/lib/server-actions/User";
import { TUserSchema } from "@/types";
import axios from "@/utils/axios";
import { Divider, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import {
    MaterialReactTable,
    MRT_ColumnDef,
    MRT_TableOptions,
    useMaterialReactTable,
} from "material-react-table";
import { useMemo } from "react";
import { toast } from "react-toastify";

export default function UserAdministrationPage() {
    const { data } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const { data } = await axios.get("/api/dashboardv2/user/list");
            return data.users;
        },
        initialData: [],
    });
    const columns = useMemo<MRT_ColumnDef<TUserSchema>[]>(
        () => [
            {
                accessorKey: "username",
                header: "Username",
                enableEditing: false,
            },
            {
                accessorKey: "role",
                header: "Role",
                editVariant: "select",
                editSelectOptions: ["admin", "editor", "user", "guest"],
            },
            {
                accessorKey: "lastAccess",
                header: "Last Access",
                Cell: ({ cell }) =>
                    new Date(cell.getValue<string>()).toLocaleString(),
                enableEditing: false,
            },
        ],
        [],
    );

    const handleEditUser: MRT_TableOptions<TUserSchema>["onEditingRowSave"] =
        async ({ values, table }) => {
            console.log(values);
            const res = await updateUser(values);
            if (!res.success) {
                toast.error(res.message);
                return;
            } else {
                toast.success("User info edited");
                table.setEditingRow(null);
            }
        };

    const table = useMaterialReactTable({
        columns,
        data,
        enableBottomToolbar: false,
        enableTopToolbar: false,
        enableEditing: true,
        onEditingRowSave: handleEditUser,
    });

    return (
        <div className="bg-white h-full w-full p-8">
            <Typography variant="h3">Users</Typography>
            <Divider />
            <MaterialReactTable table={table} />
        </div>
    );
}
