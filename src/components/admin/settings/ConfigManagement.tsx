"use client";

import { useState } from "react";
import {
    useConfigs,
    useCreateConfig,
    useUpdateConfig,
    useDeleteConfig,
    Config,
} from "@/hooks/api/useConfig";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Key, Settings2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ConfigFormData {
    key: string;
    value: string;
    description: string;
}

const initialFormData: ConfigFormData = {
    key: "",
    value: "",
    description: "",
};

export default function ConfigManagement() {
    const { toast } = useToast();
    const { data: configsData, isLoading, error } = useConfigs();
    const createConfigMutation = useCreateConfig();
    const updateConfigMutation = useUpdateConfig();
    const deleteConfigMutation = useDeleteConfig();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState<Config | null>(null);
    const [formData, setFormData] = useState<ConfigFormData>(initialFormData);
    const [formErrors, setFormErrors] = useState<Partial<ConfigFormData>>({});

    const configs = configsData?.data || [];

    const validateForm = (data: ConfigFormData): boolean => {
        const errors: Partial<ConfigFormData> = {};

        if (!data.key.trim()) {
            errors.key = "Key is required";
        } else if (!/^[a-zA-Z0-9_.-]+$/.test(data.key)) {
            errors.key =
                "Key can only contain letters, numbers, dots, hyphens, and underscores";
        }

        if (!data.value.trim()) {
            errors.value = "Value is required";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreate = async () => {
        if (!validateForm(formData)) return;

        // Check if key already exists
        const existingConfig = configs.find(
            (config) => config.key === formData.key,
        );
        if (existingConfig) {
            setFormErrors({
                key: "A configuration with this key already exists",
            });
            return;
        }

        try {
            await createConfigMutation.mutateAsync({
                key: formData.key,
                value: formData.value,
                description: formData.description || "",
            });

            toast({
                title: "Configuration created",
                description: `Configuration "${formData.key}" has been created successfully.`,
            });

            setIsCreateDialogOpen(false);
            setFormData(initialFormData);
            setFormErrors({});
        } catch (error) {
            toast({
                title: "Error",
                description:
                    "Failed to create configuration. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleEdit = async () => {
        if (!selectedConfig || !validateForm(formData)) return;

        try {
            await updateConfigMutation.mutateAsync({
                key: formData.key,
                value: formData.value,
                description: formData.description || "",
            });

            toast({
                title: "Configuration updated",
                description: `Configuration "${formData.key}" has been updated successfully.`,
            });

            setIsEditDialogOpen(false);
            setSelectedConfig(null);
            setFormData(initialFormData);
            setFormErrors({});
        } catch (error) {
            toast({
                title: "Error",
                description:
                    "Failed to update configuration. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async () => {
        if (!selectedConfig) return;

        try {
            await deleteConfigMutation.mutateAsync(selectedConfig.id);

            toast({
                title: "Configuration deleted",
                description: `Configuration "${selectedConfig.key}" has been deleted successfully.`,
            });

            setIsDeleteDialogOpen(false);
            setSelectedConfig(null);
        } catch (error) {
            toast({
                title: "Error",
                description:
                    "Failed to delete configuration. Please try again.",
                variant: "destructive",
            });
        }
    };

    const openCreateDialog = () => {
        setFormData(initialFormData);
        setFormErrors({});
        setIsCreateDialogOpen(true);
    };

    const openEditDialog = (config: Config) => {
        setSelectedConfig(config);
        setFormData({
            key: config.key,
            value: config.value,
            description: config.description || "",
        });
        setFormErrors({});
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (config: Config) => {
        setSelectedConfig(config);
        setIsDeleteDialogOpen(true);
    };

    const handleInputChange = (field: keyof ConfigFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (formErrors[field]) {
            setFormErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                        <Settings2 className="h-8 w-8 text-muted-foreground mx-auto" />
                        <p className="text-sm text-muted-foreground">
                            Failed to load configurations. Please try again.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h3 className="text-lg font-medium">
                        Configuration Settings
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {configs.length} configuration
                        {configs.length !== 1 ? "s" : ""} total
                    </p>
                </div>
                <Button onClick={openCreateDialog} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Config
                </Button>
            </div>

            {/* Table */}
            {configs.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                            <Key className="h-8 w-8 text-muted-foreground mx-auto" />
                            <p className="text-sm text-muted-foreground">
                                No configurations found. Create your first
                                configuration to get started.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={openCreateDialog}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Config
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Key</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-24">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {configs.map((config) => (
                                <TableRow key={config.id}>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Badge
                                                variant="outline"
                                                className="font-mono text-xs"
                                            >
                                                {config.key}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="max-w-xs truncate font-mono text-sm">
                                            {config.value}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="max-w-sm truncate text-sm text-muted-foreground">
                                            {config.description ||
                                                "No description"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    openEditDialog(config)
                                                }
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    openDeleteDialog(config)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Create Dialog */}
            <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Configuration</DialogTitle>
                        <DialogDescription>
                            Add a new configuration setting to your application.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-key">Key</Label>
                            <Input
                                id="create-key"
                                placeholder="e.g., app.name"
                                value={formData.key}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                ) => handleInputChange("key", e.target.value)}
                                className={
                                    formErrors.key ? "border-red-500" : ""
                                }
                            />
                            {formErrors.key && (
                                <p className="text-sm text-red-500">
                                    {formErrors.key}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-value">Value</Label>
                            <Input
                                id="create-value"
                                placeholder="Configuration value"
                                value={formData.value}
                                onChange={(e) =>
                                    handleInputChange("value", e.target.value)
                                }
                                className={
                                    formErrors.value ? "border-red-500" : ""
                                }
                            />
                            {formErrors.value && (
                                <p className="text-sm text-red-500">
                                    {formErrors.value}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-description">
                                Description (optional)
                            </Label>
                            <Textarea
                                id="create-description"
                                placeholder="Describe what this configuration controls"
                                value={formData.description}
                                onChange={(
                                    e: React.ChangeEvent<HTMLTextAreaElement>,
                                ) =>
                                    handleInputChange(
                                        "description",
                                        e.target.value,
                                    )
                                }
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateDialogOpen(false)}
                            disabled={createConfigMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={createConfigMutation.isPending}
                        >
                            {createConfigMutation.isPending
                                ? "Creating..."
                                : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Configuration</DialogTitle>
                        <DialogDescription>
                            Update the configuration setting.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-key">Key</Label>
                            <Input
                                id="edit-key"
                                value={formData.key}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                ) => handleInputChange("key", e.target.value)}
                                className={
                                    formErrors.key ? "border-red-500" : ""
                                }
                            />
                            {formErrors.key && (
                                <p className="text-sm text-red-500">
                                    {formErrors.key}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-value">Value</Label>
                            <Input
                                id="edit-value"
                                value={formData.value}
                                onChange={(e) =>
                                    handleInputChange("value", e.target.value)
                                }
                                className={
                                    formErrors.value ? "border-red-500" : ""
                                }
                            />
                            {formErrors.value && (
                                <p className="text-sm text-red-500">
                                    {formErrors.value}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">
                                Description (optional)
                            </Label>
                            <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(
                                    e: React.ChangeEvent<HTMLTextAreaElement>,
                                ) =>
                                    handleInputChange(
                                        "description",
                                        e.target.value,
                                    )
                                }
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                            disabled={updateConfigMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEdit}
                            disabled={updateConfigMutation.isPending}
                        >
                            {updateConfigMutation.isPending
                                ? "Updating..."
                                : "Update"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete Configuration
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the configuration
                            &quot;{selectedConfig?.key}&quot;? This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={deleteConfigMutation.isPending}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteConfigMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleteConfigMutation.isPending
                                ? "Deleting..."
                                : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
