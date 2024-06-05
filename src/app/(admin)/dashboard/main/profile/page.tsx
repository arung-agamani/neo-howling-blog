"use client";

import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "@/utils/axios";
import { emptyHelloResponse, HelloResponse } from "@/types";
import { Button } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";

import SingleFieldForm from "@/components/Dashboard/SingleFieldForm";
import { toast } from "react-toastify";
export default function Page() {
    const queryClient = useQueryClient();
    const { data: user, isSuccess } = useQuery({
        queryKey: ["currentAuthenticatedUser"],
        queryFn: async () => {
            const res = await axios.get("/api/hellov2", {
                withCredentials: true,
            });
            const validated = HelloResponse.safeParse(res.data);
            if (!validated.success) {
                return emptyHelloResponse.user;
            }
            return validated.data.user;
        },
    });

    const updateUser = async (id: string, value: string) => {
        if (!user) return;
        const payload: any = { id: user.id };
        payload[id] = value;
        try {
            await axios.post("/api/dashboardv2/user/update", payload);
            toast.success(`Data \`${id}\` updated`);
            queryClient.invalidateQueries({
                queryKey: ["currentAuthenticatedUser"],
            });
        } catch (error) {
            toast.error(`Data update failed`);
        }
    };

    if (!isSuccess) return;
    return (
        <Paper className="mx-2 my-2 px-4 py-2">
            <Typography variant="h3">Profile</Typography>
            <Divider sx={{ marginBottom: 1 }} />
            <div className="grid grid-cols-2">
                <div className="grid grid-cols-2 gap-y-2">
                    <div className="col-span-2">
                        <div
                            style={{
                                backgroundImage: "url('/test-avatar.png')",
                                backgroundPosition: "center center",
                                backgroundSize: "cover",
                                backgroundColor: "#ccccc",
                                width: "300px",
                                height: "300px",
                                borderRadius: "150px",
                            }}
                        ></div>
                    </div>
                    <Typography variant="h4" className="col-span-2">
                        Personal Info
                    </Typography>
                    <Divider className="col-span-2" sx={{ marginBottom: 2 }} />

                    <Typography variant="h5">Username</Typography>
                    <Typography variant="h6">{user.username}</Typography>
                    <Typography variant="h5">Role</Typography>
                    <Typography variant="h6">{user.role}</Typography>
                    <Divider
                        className="col-span-2"
                        sx={{ marginTop: 2, marginBottom: 2 }}
                    />
                    <Typography variant="h5">Name</Typography>
                    <SingleFieldForm
                        id={"name"}
                        value={user.name || "Empty field..."}
                        save={updateUser}
                    />
                    <Typography variant="h5">Birthday</Typography>
                    <SingleFieldForm
                        id={"birthday"}
                        value={
                            user.birthday?.toDateString() || "Empty field..."
                        }
                        save={updateUser}
                    />
                    <Typography variant="h5">Gender</Typography>
                    <SingleFieldForm
                        id={"gender"}
                        value={user.gender || "Empty field..."}
                        save={updateUser}
                    />
                    <Typography variant="h5">Phone</Typography>
                    <SingleFieldForm
                        id={"phone"}
                        value={user.phone || "Empty field..."}
                        save={updateUser}
                    />

                    <Divider className="col-span-2" sx={{ marginBottom: 2 }} />
                </div>
            </div>
        </Paper>
    );
}
