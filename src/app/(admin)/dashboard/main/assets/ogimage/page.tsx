"use client";
import { Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const OGImagePayload = z.object({
    title: z.string(),
    fontSize: z.coerce.number().nonnegative().gte(1),
    imageLeft: z.string(),
    imageCenter: z.string(),
    imageRight: z.string(),
});

type TOGImagePayload = z.infer<typeof OGImagePayload>;

export default function OGImagePage() {
    const [params, setParams] = useState("");
    const { handleSubmit, control } = useForm();
    const submit = async (data: any) => {
        console.log(data);
        const validate = OGImagePayload.safeParse(data);
        if (!validate.success) {
            return;
        }
        const urlParams = new URLSearchParams();
        for (const [key, value] of Object.entries(validate.data)) {
            urlParams.set(key, String(value));
        }
        console.log(urlParams.toString());
        setParams(urlParams.toString());
    };

    return (
        <div className="h-full flex flex-col bg-white p-8">
            <div id="preview" className="flex-grow mx-auto py-4">
                <img
                    src={`/api/og?${params}`}
                    alt=""
                    className="max-h-[300px] mx-auto"
                />
                <p>
                    Link:{" "}
                    <a href={`/api/og?${params}`} className="hyperlink">
                        /api/og?{params}
                    </a>
                </p>
            </div>
            <form
                id="control"
                className="grid grid-cols-8 content-center gap-2"
                onSubmit={handleSubmit(submit)}
            >
                <div className="flex items-center">
                    <Typography>Label</Typography>
                </div>
                <Controller
                    name="title"
                    control={control}
                    defaultValue={""}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            className="col-span-7"
                            label="Main Text"
                        />
                    )}
                />
                <div className="flex items-center">
                    <Typography>Label</Typography>
                </div>
                <Controller
                    control={control}
                    name="fontSize"
                    defaultValue={""}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            className="col-span-7"
                            label="Font Size"
                            type={"number"}
                        />
                    )}
                />
                <div className="flex items-center">
                    <Typography>Label</Typography>
                </div>
                <Controller
                    control={control}
                    name="imageLeft"
                    defaultValue={""}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            className="col-span-7"
                            label="Image Left"
                        />
                    )}
                />
                <div className="flex items-center">
                    <Typography>Label</Typography>
                </div>
                <Controller
                    control={control}
                    name="imageCenter"
                    defaultValue={""}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            className="col-span-7"
                            label="Image Center"
                        />
                    )}
                />
                <div className="flex items-center">
                    <Typography>Label</Typography>
                </div>
                <Controller
                    control={control}
                    name="imageRight"
                    defaultValue={""}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            className="col-span-7"
                            label="Image Right"
                        />
                    )}
                />
                <div className="col-span-8">
                    <Button fullWidth variant="contained" type="submit">
                        Submit
                    </Button>
                </div>
            </form>
        </div>
    );
}
