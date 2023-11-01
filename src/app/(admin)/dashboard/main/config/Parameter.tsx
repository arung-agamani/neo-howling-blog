"use client";

import { Config } from "./page";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import "./glow.css";
import axios from "@/utils/axios";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

const ConfigSchema = z.object({
    id: z.string(),
    key: z.string(),
    value: z.string(),
    description: z.string().optional(),
});

const Parameter: React.FC<{ config: Config }> = ({ config }) => {
    const [formDisabled, setFormDisabled] = useState(false);
    const { handleSubmit, control, getFieldState, reset } = useForm({
        resolver: zodResolver(ConfigSchema),
        defaultValues: {
            id: config.id,
            key: config.key,
            value: config.value,
        },
    });

    const submit = async (data: any) => {
        try {
            const res = await axios.post("/api/dashboardv2/config", data, {
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
            const res = await axios.delete("/api/dashboardv2/config", {
                withCredentials: true,
                params: {
                    id: config.id,
                },
            });
            toast.warn(`${config.key} has been deleted`);
            setFormDisabled(true);
        } catch (error) {
            if (error instanceof AxiosError) {
                toast.error(error.response?.data.message);
            } else {
                toast.error("Unknown error when submitting parameter changes");
            }
        }
    };

    return (
        <form
            onSubmit={handleSubmit(submit)}
            className="flex w-full gap-2 my-2"
        >
            <Controller
                name="key"
                control={control}
                rules={{ required: true }}
                defaultValue={config.key}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="Key"
                        className={`w-full ${
                            getFieldState("key").isDirty ? "glow" : ""
                        }`}
                    />
                )}
                disabled={formDisabled}
            />
            <Controller
                name="value"
                control={control}
                rules={{ required: true }}
                defaultValue={config.value}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label="Value"
                        className={`w-full ${
                            getFieldState("value").isDirty ? "glow" : ""
                        }`}
                    />
                )}
                disabled={formDisabled}
            />
            <Button variant="contained" type="submit" disabled={formDisabled}>
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
    );
};

export default Parameter;
