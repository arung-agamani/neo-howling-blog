"use client";

import {
    MaterialReactTable,
    MRT_ColumnDef,
    useMaterialReactTable,
} from "material-react-table";
import { useMemo } from "react";

interface Props {
    tags: Tags[];
}
type Tags = {
    id: string;
    count: number;
    name: string;
    posts: string[];
};

const TagsTable: React.FC<Props> = ({ tags }) => {
    const columns = useMemo<MRT_ColumnDef<Tags>[]>(
        () => [
            {
                accessorKey: "name",
                header: "Tag Name",
            },
            {
                accessorKey: "count",
                header: "Count",
            },
        ],
        [],
    );

    const table = useMaterialReactTable({
        columns,
        data: tags,
        enableBottomToolbar: false,
        enableTopToolbar: false,
        enableEditing: false,
    });

    return <MaterialReactTable table={table} />;
};

export default TagsTable;
