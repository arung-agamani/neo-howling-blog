"use client";

import { useState, useEffect, Fragment } from "react";
import { useForm, Controller } from "react-hook-form";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider/Divider";
import axios from "@/utils/axios";
import { AxiosResponse } from "axios";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

interface Config {
    key: string;
    value: string;
    description: string;
}

interface ConfigAPIGetResponse {
    count: number;
    data: Config[];
}

interface ConfigAPIPostResponse {
    message: string;
    data: any;
}

const ConfigSchema = z.object({
    key: z.string(),
    value: z.string(),
    description: z.string().optional(),
});

export default function Page() {
    const [loading, isLoading] = useState(true);
    const [configs, setConfigs] = useState<Config[]>([]);
    const { handleSubmit, control, reset } = useForm({
        resolver: zodResolver(ConfigSchema),
    });

    async function fetchConfigs() {
        isLoading(true);
        const { data: axiosResponseData } = await axios.get<
            {},
            AxiosResponse<ConfigAPIGetResponse>
        >("/api/dashboardv2/config", { withCredentials: true });
        setConfigs(axiosResponseData.data);
        isLoading(false);
    }

    useEffect(() => {
        (async () => {
            await fetchConfigs();
        })();
    }, []);

    async function onNewParameterSubmit(data: any) {
        const res = await axios.post<
            Config,
            AxiosResponse<ConfigAPIPostResponse>
        >("/api/dashboardv2/config", data, { withCredentials: true });
        toast.info(res.data.message);
        await fetchConfigs();
        toast.info("Config refetched");
    }

    if (loading) return null;
    return (
        <Paper
            sx={{
                padding: "2rem 2rem",
            }}
        >
            <Typography variant="h4">Configurations</Typography>
            <Typography variant="body1">
                This page contains configurations to control the behavior of the
                website.
            </Typography>
            <Divider />
            <Typography variant="h6" marginTop={"0.5rem"}>
                Add New Parameter
            </Typography>
            <form
                className="grid grid-cols-2 gap-2 my-2"
                onSubmit={handleSubmit(onNewParameterSubmit)}
            >
                <Controller
                    name="key"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <TextField {...field} label="Parameter Key" />
                    )}
                />

                <Controller
                    name="value"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <TextField {...field} label="Parameter Value" />
                    )}
                />
                <Controller
                    name="description"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            variant="outlined"
                            label="Parameter Description"
                            className=" col-span-2"
                        />
                    )}
                />
                <Button
                    variant="contained"
                    className="col-span-2"
                    type="submit"
                >
                    Add New Parameter
                </Button>
            </form>
            <Divider />
            <Typography variant="h6" marginTop={"0.5rem"}>
                Parameters
            </Typography>
            <div className="grid grid-cols-2 gap-2 my-2">
                {configs.map((config) => {
                    return (
                        <Fragment key={config.key}>
                            <TextField defaultValue={config.key} label="Key" />
                            <TextField
                                defaultValue={config.value}
                                label="Value"
                            />
                        </Fragment>
                    );
                })}
            </div>
        </Paper>
    );
}
