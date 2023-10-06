"use client";

import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { useAppSelector } from "@/stores/hooks";
import { UserState } from "@/stores/slice/user";

export default function Page() {
    const user = useAppSelector(UserState);
    return (
        <Paper className="mx-2 my-2 px-4 py-2">
            <Typography variant="h3">Profile</Typography>
            <Divider sx={{ marginBottom: 4 }} />
            <div className="grid grid-cols-2">
                <div className="grid grid-cols-2">
                    <Typography variant="h4" className="col-span-2">
                        Personal Info
                    </Typography>
                    <Divider className="col-span-2" sx={{ marginBottom: 2 }} />

                    <Typography variant="h5">Username</Typography>
                    <Typography variant="h6">{user.username}</Typography>

                    <Typography variant="h5">Role</Typography>
                    <Typography variant="h6">{user.role}</Typography>

                    <Typography variant="h5">Name</Typography>
                    <Typography variant="h6">{user.role}</Typography>

                    <Typography variant="h5">Birthday</Typography>
                    <Typography variant="h6">{user.role}</Typography>

                    <Typography variant="h5">Gender</Typography>
                    <Typography variant="h6">{user.role}</Typography>

                    <Typography variant="h5">Email</Typography>
                    <Typography variant="h6">{user.role}</Typography>

                    <Typography variant="h5">Phone</Typography>
                    <Typography variant="h6">{user.role}</Typography>

                    <Divider className="col-span-2" sx={{ marginBottom: 2 }} />
                </div>
            </div>
        </Paper>
    );
}
