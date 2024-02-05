/* eslint-disable react/no-unescaped-entities */
"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { LoginParams, SignupRequestBody } from "@/types";
import axios from "@/utils/axios";
import { AxiosError } from "axios";
import "./shadow.css";

export default function Login() {
    const router = useRouter();
    const [mode, setMode] = useState<"login" | "signup">("login");
    const { status } = useSession();
    const { handleSubmit, control, reset, setError } = useForm();
    const [loading, isLoading] = useState(false);
    const submit = async (data: any) => {
        isLoading(true);
        if (mode === "login") {
            const validate = LoginParams.safeParse(data);
            if (!validate.success) {
                toast.error("Validation error.");
                console.log(validate.error.issues);
                validate.error.issues.forEach((issue) => {
                    setError(issue.path.join("."), {
                        type: "validate",
                        message: issue.message,
                    });
                });
                isLoading(false);
                return;
            }
            const res = await signIn("credentials", {
                username: validate.data.username,
                password: validate.data.password,
                redirect: false,
            });
            // reset({
            //     username: "",
            //     password: "",
            // });
            if (res) {
                if (res.ok) router.push("/dashboard/main");
                else {
                    switch (res.error) {
                        case "CredentialsSignin":
                            // `authorize` callback returns null, means no user found with given creds
                            // TODO: Try to contribute for docs in NextAuth.js repo
                            // TODO: Additionally try to define typings as res.error is string
                            toast.error("Invalid credentials");
                            setError("username", {
                                type: "validate",
                                message:
                                    "Invalid credentials. Please check your username",
                            });
                            setError("password", {
                                type: "validate",
                                message:
                                    "Invalid credentails. Please check your password",
                            });
                            break;
                        default:
                            toast.error(
                                "Unhandled SignIn-page error.\nPlease check again your username and password",
                            );
                            break;
                    }
                }
            }
            isLoading(false);
        } else {
            try {
                const validate = SignupRequestBody.safeParse(data);
                if (!validate.success) {
                    toast.error("Validation error.");
                    console.log(validate.error.issues);
                    // setError("username", { type: "validate", message: validate.error.})

                    isLoading(false);
                    return;
                }
                const res = await axios.post("/api/signupv2", {
                    username: validate.data.username,
                    password: validate.data.password,
                    confirmPassword: validate.data.confirmPassword,
                });
                isLoading(false);
                toast.success("User created! Return to login please");
                reset({
                    username: "",
                    password: "",
                });
            } catch (error) {
                reset({
                    username: "",
                    password: "",
                });
                toast.error("Something went wrong");
                if (error instanceof AxiosError) {
                    toast.error(error.response?.data.message);
                    console.error(error.response?.data);
                }
                isLoading(false);
            }
        }
    };

    if (status === "authenticated") {
        router.push("/dashboard/main");
    }

    return (
        <form onSubmit={handleSubmit(submit)}>
            <div className="grid grid-cols-2 max-w-4xl  shadow-lg shadow-southeast">
                <div className=" bg-slate-50 bg-opacity-90 rounded-l-lg pr-4 pl-2 py-8">
                    <Typography className="py-2 text-right" variant="h4">
                        <i>Perishing Peculiar Pandora Panopticon</i>
                    </Typography>
                    <Typography variant="body1" className="text-right">
                        While the world was at it's end, a group of mysterious
                        spirits approached the neverending stream of wind with
                        chance of gold threads.
                        <br />
                        <br />
                        It wasn't obvious at first, but soon as they manifested
                        themselves into a single entity, sacrifices were bound
                        to happen.
                        <br />
                        <br />
                        <i>"See you at the other side, Elfrieden..."</i>
                        <br />
                        <br />
                        Your Soul Holding my heart and my soul in my both hands,
                        I faced the gate which would take me beyond the
                        dimension a mere human can comprehend...
                    </Typography>
                </div>
                <div
                    className={`px-4 bg-white ${
                        loading ? "bg-opacity-90" : "bg-opacity-20"
                    } transition-all duration-500 py-8`}
                >
                    {!loading ? (
                        mode === "login" ? (
                            <div className="gap-2 flex flex-col justify-center w-full h-full">
                                <div className="bg-white">
                                    <Controller
                                        name="username"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                label="Your Dignity"
                                                type="text"
                                                variant="filled"
                                                className="w-full"
                                                error={
                                                    fieldState.error !==
                                                    undefined
                                                }
                                                helperText={
                                                    fieldState.error?.message
                                                }
                                                {...field}
                                            />
                                        )}
                                    />
                                </div>
                                <div className="bg-white">
                                    <Controller
                                        name="password"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                label="Your Soul"
                                                type="password"
                                                variant="filled"
                                                className="w-full"
                                                error={
                                                    fieldState.error !==
                                                    undefined
                                                }
                                                helperText={
                                                    fieldState.error?.message
                                                }
                                                {...field}
                                            />
                                        )}
                                    />
                                </div>
                                <Button variant="contained" type="submit">
                                    Login
                                </Button>
                                <Typography variant="caption">
                                    Don't have an account?{" "}
                                    <span
                                        className=" text-blue-500 hover:text-blue-300 cursor-pointer"
                                        onClick={() => {
                                            setMode("signup");
                                        }}
                                    >
                                        Sign Up
                                    </span>
                                </Typography>
                            </div>
                        ) : (
                            <div className="gap-2 flex flex-col justify-center w-full h-full">
                                <div className="bg-white">
                                    <Controller
                                        name="username"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                label="Username"
                                                type="text"
                                                variant="filled"
                                                className="w-full"
                                                error={
                                                    fieldState.error !==
                                                    undefined
                                                }
                                                helperText={
                                                    fieldState.error?.message
                                                }
                                                {...field}
                                            />
                                        )}
                                    />
                                </div>
                                <div className="bg-white">
                                    <Controller
                                        name="password"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                label="Password"
                                                type="password"
                                                variant="filled"
                                                className="w-full"
                                                error={
                                                    fieldState.error !==
                                                    undefined
                                                }
                                                helperText={
                                                    fieldState.error?.message
                                                }
                                                {...field}
                                            />
                                        )}
                                    />
                                </div>
                                <div className="bg-white">
                                    <Controller
                                        name="confirmPassword"
                                        control={control}
                                        rules={{ required: true }}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                label="Confirm Password"
                                                type="password"
                                                variant="filled"
                                                className="w-full"
                                                error={
                                                    fieldState.error !==
                                                    undefined
                                                }
                                                helperText={
                                                    fieldState.error?.message
                                                }
                                                {...field}
                                            />
                                        )}
                                    />
                                </div>
                                <Button variant="contained" type="submit">
                                    Sign Up
                                </Button>
                                <Typography variant="caption">
                                    Already have an account?{" "}
                                    <span
                                        className=" text-blue-500 hover:text-blue-300 cursor-pointer"
                                        onClick={() => {
                                            reset();
                                            setMode("login");
                                        }}
                                    >
                                        Login
                                    </span>
                                </Typography>
                            </div>
                        )
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            <CircularProgress />
                            <Typography>Signing you in...</Typography>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}
