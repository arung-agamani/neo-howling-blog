"use client";

import { Config, ConfigType } from "./page";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import "./glow.css";
import axios from "@/utils/axios";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import Editor from "@monaco-editor/react";

const ConfigTypeEnum = z.enum(["string", "number", "boolean", "json"]);

const ConfigSchema = z.object({
    id: z.string(),
    key: z.string(),
    value: z.string(),
    description: z.string().optional(),
    type: ConfigTypeEnum.optional().default("string"),
});

interface ParameterProps {
    config: Config;
    onDelete?: () => void;
}

const Parameter: React.FC<ParameterProps> = ({ config, onDelete }) => {
    const [formDisabled, setFormDisabled] = useState(false);
    const [jsonDialogOpen, setJsonDialogOpen] = useState(false);
    const [tempJsonValue, setTempJsonValue] = useState(config.value);
    const [jsonError, setJsonError] = useState<string | null>(null);

    const { handleSubmit, control, getFieldState, reset, setValue, watch } =
        useForm({
            resolver: zodResolver(ConfigSchema),
            defaultValues: {
                id: config.id,
                key: config.key,
                value: config.value,
                description: config.description,
                type: config.type || "string",
            },
        });

    const currentType = watch("type") as ConfigType;
    const currentValue = watch("value");

    const submit = async (data: any) => {
        try {
            const res = await axios.post("/api/v1/config", data, {
                withCredentials: true,
            });
            toast.info(`${data.key} has been updated`);
            reset(data);
        } catch (error) {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data.message);
            } else {
                toast.error("Unknown error when submitting parameter changes");
            }
        }
    };

    const deleteParam = async () => {
        try {
            const res = await axios.delete("/api/v1/config", {
                withCredentials: true,
                params: {
                    id: config.id,
                },
            });
            toast.warn(`${config.key} has been deleted`);
            setFormDisabled(true);
            onDelete?.();
        } catch (error) {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data.message);
            } else {
                toast.error("Unknown error when submitting parameter changes");
            }
        }
    };

    const handleJsonDialogOpen = () => {
        setTempJsonValue(currentValue);
        setJsonError(null);
        setJsonDialogOpen(true);
    };

    const handleJsonDialogClose = () => {
        setJsonDialogOpen(false);
        setJsonError(null);
    };

    const handleJsonSave = () => {
        try {
            // Validate JSON
            JSON.parse(tempJsonValue);
            setValue("value", tempJsonValue, { shouldDirty: true });
            setJsonDialogOpen(false);
            setJsonError(null);
        } catch (e) {
            setJsonError("Invalid JSON format");
        }
    };

    const formatJson = () => {
        try {
            const parsed = JSON.parse(tempJsonValue);
            setTempJsonValue(JSON.stringify(parsed, null, 2));
            setJsonError(null);
        } catch (e) {
            setJsonError("Invalid JSON format - cannot format");
        }
    };

    const renderValueInput = () => {
        switch (currentType) {
            case "number":
                return (
                    <Controller
                        name="value"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Value"
                                type="number"
                                className={`w-full ${getFieldState("value").isDirty ? "glow" : ""}`}
                                disabled={formDisabled}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Allow empty, negative, decimals
                                    if (
                                        val === "" ||
                                        val === "-" ||
                                        !isNaN(Number(val))
                                    ) {
                                        field.onChange(val);
                                    }
                                }}
                                inputProps={{
                                    inputMode: "decimal",
                                }}
                            />
                        )}
                    />
                );

            case "boolean":
                return (
                    <Controller
                        name="value"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={field.value === "true"}
                                        onChange={(e) => {
                                            field.onChange(
                                                e.target.checked
                                                    ? "true"
                                                    : "false",
                                            );
                                        }}
                                        disabled={formDisabled}
                                    />
                                }
                                label={`Value: ${field.value}`}
                                className={`w-full ${getFieldState("value").isDirty ? "glow" : ""}`}
                            />
                        )}
                    />
                );

            case "json":
                return (
                    <div
                        className={`flex items-center gap-2 w-full ${getFieldState("value").isDirty ? "glow" : ""}`}
                    >
                        <TextField
                            value={currentValue}
                            label="Value (JSON)"
                            className="w-full"
                            disabled
                            multiline={false}
                            InputProps={{
                                readOnly: true,
                            }}
                        />
                        <Button
                            variant="outlined"
                            onClick={handleJsonDialogOpen}
                            disabled={formDisabled}
                            sx={{ minWidth: "auto", px: 2 }}
                        >
                            <EditIcon />
                        </Button>
                    </div>
                );

            case "string":
            default:
                return (
                    <Controller
                        name="value"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Value"
                                className={`w-full ${getFieldState("value").isDirty ? "glow" : ""}`}
                                disabled={formDisabled}
                            />
                        )}
                    />
                );
        }
    };

    return (
        <>
            <form
                onSubmit={handleSubmit(submit)}
                className="flex flex-wrap w-full gap-2 my-2 items-center"
            >
                <Controller
                    name="key"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Key"
                            className={`flex-1 min-w-[150px] ${getFieldState("key").isDirty ? "glow" : ""}`}
                            disabled={formDisabled}
                        />
                    )}
                />

                <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                        <FormControl
                            sx={{ minWidth: 120 }}
                            disabled={formDisabled}
                        >
                            <InputLabel id={`type-select-label-${config.id}`}>
                                Type
                            </InputLabel>
                            <Select
                                {...field}
                                labelId={`type-select-label-${config.id}`}
                                label="Type"
                                className={
                                    getFieldState("type").isDirty ? "glow" : ""
                                }
                            >
                                <MenuItem value="string">String</MenuItem>
                                <MenuItem value="number">Number</MenuItem>
                                <MenuItem value="boolean">Boolean</MenuItem>
                                <MenuItem value="json">JSON</MenuItem>
                            </Select>
                        </FormControl>
                    )}
                />

                <div className="flex-1 min-w-[200px]">{renderValueInput()}</div>

                <Button
                    variant="contained"
                    type="submit"
                    disabled={formDisabled}
                >
                    <SaveIcon />
                </Button>
                <Button
                    variant="contained"
                    type="button"
                    color="secondary"
                    disabled={formDisabled}
                    onClick={() => deleteParam()}
                >
                    <DeleteIcon />
                </Button>
            </form>

            {/* JSON Editor Dialog */}
            <Dialog
                open={jsonDialogOpen}
                onClose={handleJsonDialogClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Edit JSON Value</DialogTitle>
                <DialogContent>
                    <div
                        className="mt-2"
                        style={{
                            height: "400px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                        }}
                    >
                        <Editor
                            height="100%"
                            defaultLanguage="json"
                            value={tempJsonValue}
                            onChange={(value) => {
                                setTempJsonValue(value || "");
                                setJsonError(null);
                            }}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: "on",
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2,
                                wordWrap: "on",
                            }}
                        />
                    </div>
                    {jsonError && (
                        <p className="text-red-500 mt-2 text-sm">{jsonError}</p>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={formatJson} color="info">
                        Format JSON
                    </Button>
                    <Button onClick={handleJsonDialogClose}>Cancel</Button>
                    <Button
                        onClick={handleJsonSave}
                        variant="contained"
                        color="primary"
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Parameter;
