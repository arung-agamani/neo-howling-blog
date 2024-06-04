import { zodResolver } from "@hookform/resolvers/zod";
import { Button, TextField, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import SaveIcon from "@mui/icons-material/Save";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import { z } from "zod";
import { useState } from "react";

interface Props {
    id: string;
    value: string;
    save: (id: string, value: string) => Promise<void>;
}

const FieldSchema = z.object({
    id: z.string(),
    value: z.string(),
});
type FieldSchema = z.infer<typeof FieldSchema>;

const SingleFieldForm: React.FC<Props> = ({ id, value, save }) => {
    const [isEditing, setIsEditing] = useState(false);
    const { handleSubmit, control, getFieldState, reset } = useForm({
        resolver: zodResolver(FieldSchema),
        defaultValues: {
            id,
            value,
        },
    });

    const submit = async (data: FieldSchema) => {
        await save(data.id, data.value);
        setIsEditing(false);
    };
    if (!isEditing) {
        return (
            <div className="flex gap-2">
                <Button
                    variant="contained"
                    type="submit"
                    onClick={() => setIsEditing(true)}
                >
                    <ModeEditIcon />
                </Button>
                <Typography variant="h6">{value}</Typography>
            </div>
        );
    }
    return (
        <form onSubmit={handleSubmit(submit)} className="flex">
            <Controller
                name="value"
                control={control}
                rules={{ required: true }}
                defaultValue={value}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label={id}
                        className={`w-full ${
                            getFieldState("id").isDirty ? "glow" : ""
                        }`}
                    />
                )}
            />
            <Button variant="contained" type="submit">
                <SaveIcon />
            </Button>
        </form>
    );
};

export default SingleFieldForm;
