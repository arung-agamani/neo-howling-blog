"use client";

import React, { useMemo, useCallback, memo } from "react";
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_RowSelectionState,
    type MRT_Updater,
} from "material-react-table";
import { Box, Typography, Chip, IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { Tag } from "@/types";

interface TagsTableProps {
    tags: Tag[];
    isLoading?: boolean;
    rowSelection: MRT_RowSelectionState;
    onRowSelectionChange: (updater: MRT_Updater<MRT_RowSelectionState>) => void;
    onEditClick: (tag: Tag) => void;
    onDeleteClick: (tag: Tag) => void;
    onViewClick: (tag: Tag) => void;
}

// Pre-defined static styles to avoid Emotion re-serialization
const staticStyles = {
    tableContainer: {
        maxHeight: "calc(100vh - 400px)",
        minHeight: 400,
    },
    tablePaper: {
        elevation: 0,
        sx: {
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
        },
    },
    tableHeadCell: {
        sx: {
            bgcolor: "grey.50",
            fontWeight: "bold",
        },
    },
    nameCell: {
        display: "flex",
        alignItems: "center",
        gap: 1,
        cursor: "pointer",
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: "50%",
        flexShrink: 0,
    },
    tagIcon: {
        fontSize: 16,
        color: "text.secondary",
    },
    descriptionText: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        maxWidth: 250,
    },
    aliasChip: {
        fontSize: "0.7rem",
        height: 20,
    },
    actionsBox: {
        display: "flex",
        gap: 0.5,
    },
    countChip: {
        minWidth: 50,
        fontWeight: "medium",
    },
} as const;

// Memoized row actions component to prevent re-renders
const RowActions = memo(function RowActions({
    tag,
    onEditClick,
    onDeleteClick,
}: {
    tag: Tag;
    onEditClick: (tag: Tag) => void;
    onDeleteClick: (tag: Tag) => void;
}) {
    const handleEdit = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onEditClick(tag);
        },
        [tag, onEditClick],
    );

    const handleDelete = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onDeleteClick(tag);
        },
        [tag, onDeleteClick],
    );

    return (
        <Box sx={staticStyles.actionsBox}>
            <Tooltip title="Edit Tag">
                <IconButton size="small" onClick={handleEdit}>
                    <EditIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Delete Tag">
                <IconButton size="small" onClick={handleDelete} color="error">
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
});

const TagsTable: React.FC<TagsTableProps> = ({
    tags,
    isLoading = false,
    rowSelection,
    onRowSelectionChange,
    onEditClick,
    onDeleteClick,
    onViewClick,
}) => {
    // Memoized columns definition
    const columns = useMemo<MRT_ColumnDef<Tag>[]>(
        () => [
            {
                accessorKey: "name",
                header: "Tag Name",
                size: 200,
                Cell: ({ row }) => {
                    const tag = row.original;
                    return (
                        <Box
                            sx={staticStyles.nameCell}
                            onClick={() => onViewClick(tag)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    onViewClick(tag);
                                }
                            }}
                        >
                            {tag.color ? (
                                <Box
                                    sx={{
                                        ...staticStyles.colorDot,
                                        bgcolor: tag.color,
                                    }}
                                />
                            ) : (
                                <LocalOfferIcon sx={staticStyles.tagIcon} />
                            )}
                            <Typography
                                variant="body2"
                                fontWeight="medium"
                                color="primary.main"
                                sx={{
                                    "&:hover": { textDecoration: "underline" },
                                }}
                            >
                                {tag.name}
                            </Typography>
                        </Box>
                    );
                },
            },
            {
                accessorKey: "count",
                header: "Posts",
                size: 100,
                Cell: ({ cell }) => {
                    const count = cell.getValue<number>();
                    return (
                        <Chip
                            label={count}
                            size="small"
                            color={count === 0 ? "warning" : "default"}
                            variant={count === 0 ? "filled" : "outlined"}
                            sx={staticStyles.countChip}
                        />
                    );
                },
            },
            {
                accessorKey: "description",
                header: "Description",
                size: 250,
                Cell: ({ cell }) => {
                    const description = cell.getValue<string | null>();
                    return description ? (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={staticStyles.descriptionText}
                        >
                            {description}
                        </Typography>
                    ) : (
                        <Typography
                            variant="body2"
                            color="text.disabled"
                            fontStyle="italic"
                        >
                            —
                        </Typography>
                    );
                },
            },
            {
                accessorKey: "aliases",
                header: "Aliases",
                size: 200,
                Cell: ({ cell }) => {
                    const aliases = cell.getValue<string[]>() || [];
                    if (aliases.length === 0) {
                        return (
                            <Typography variant="body2" color="text.disabled">
                                —
                            </Typography>
                        );
                    }
                    return (
                        <Box
                            sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
                        >
                            {aliases.slice(0, 3).map((alias) => (
                                <Chip
                                    key={alias}
                                    label={alias}
                                    size="small"
                                    variant="outlined"
                                    sx={staticStyles.aliasChip}
                                />
                            ))}
                            {aliases.length > 3 && (
                                <Chip
                                    label={`+${aliases.length - 3}`}
                                    size="small"
                                    variant="outlined"
                                    sx={staticStyles.aliasChip}
                                />
                            )}
                        </Box>
                    );
                },
            },
        ],
        [onViewClick],
    );

    const table = useMaterialReactTable({
        columns,
        data: tags,
        enableRowSelection: true,
        enableColumnFilters: false,
        enableGlobalFilter: false,
        enableDensityToggle: false,
        enableFullScreenToggle: false,
        enableColumnActions: false,
        enableHiding: false,
        enableStickyHeader: true,
        enableSorting: true,
        manualPagination: false,
        positionToolbarAlertBanner: "none",
        getRowId: (row) => row.id,
        onRowSelectionChange: onRowSelectionChange,
        state: {
            rowSelection,
            isLoading,
            showProgressBars: isLoading,
        },
        muiTableContainerProps: {
            sx: staticStyles.tableContainer,
        },
        muiTablePaperProps: staticStyles.tablePaper,
        muiTableHeadCellProps: staticStyles.tableHeadCell,
        muiTableBodyRowProps: ({ row }) => ({
            sx: {
                cursor: "pointer",
                "&:hover": {
                    bgcolor: "action.hover",
                },
            },
        }),
        enableRowActions: true,
        positionActionsColumn: "last",
        displayColumnDefOptions: {
            "mrt-row-actions": {
                size: 100,
                header: "Actions",
            },
            "mrt-row-select": {
                size: 50,
            },
        },
        renderRowActions: ({ row }) => (
            <RowActions
                tag={row.original}
                onEditClick={onEditClick}
                onDeleteClick={onDeleteClick}
            />
        ),
        initialState: {
            sorting: [{ id: "count", desc: true }],
            pagination: { pageSize: 25, pageIndex: 0 },
            density: "comfortable",
        },
        paginationDisplayMode: "pages",
        muiPaginationProps: {
            rowsPerPageOptions: [10, 25, 50, 100],
            showFirstButton: true,
            showLastButton: true,
        },
    });

    return <MaterialReactTable table={table} />;
};

export default memo(TagsTable);
