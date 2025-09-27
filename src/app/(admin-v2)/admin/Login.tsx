"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import { LoginParams, SignupRequestBody } from "@/types";
import axios from "@/utils/axios";

interface FormData {
    username: string;
    password: string;
    confirmPassword?: string;
}

export default function Login() {
    const router = useRouter();
    const [mode, setMode] = useState<"login" | "signup">("login");
    const { status } = useSession();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { register, handleSubmit, reset, formState: { errors: formErrors } } = useForm<FormData>();

    const submit = async (data: FormData) => {
        setLoading(true);
        setErrors({});

        if (mode === "login") {
            const validate = LoginParams.safeParse(data);
            if (!validate.success) {
                toast.error("Validation error.");
                const newErrors: Record<string, string> = {};
                validate.error.issues.forEach((issue) => {
                    newErrors[issue.path.join(".")] = issue.message;
                });
                setErrors(newErrors);
                setLoading(false);
                return;
            }

            const res = await signIn("credentials", {
                username: validate.data.username,
                password: validate.data.password,
                redirect: false,
            });

            if (res) {
                if (res.ok) {
                    router.push("/admin/main");
                } else {
                    switch (res.error) {
                        case "CredentialsSignin":
                            toast.error("Invalid credentials");
                            setErrors({
                                username: "Invalid credentials. Please check your username",
                                password: "Invalid credentials. Please check your password"
                            });
                            break;
                        default:
                            toast.error(
                                "Unhandled SignIn-page error.\nPlease check again your username and password"
                            );
                            break;
                    }
                }
            }
            setLoading(false);
        } else {
            try {
                const validate = SignupRequestBody.safeParse(data);
                if (!validate.success) {
                    toast.error("Validation error.");
                    console.log(validate.error.issues);
                    setLoading(false);
                    return;
                }

                await axios.post("/api/signupv2", {
                    username: validate.data.username,
                    password: validate.data.password,
                    confirmPassword: validate.data.confirmPassword,
                });

                setLoading(false);
                toast.success("User created! Return to login please");
                reset({
                    username: "",
                    password: "",
                    confirmPassword: "",
                });
            } catch (error) {
                reset({
                    username: "",
                    password: "",
                    confirmPassword: "",
                });
                toast.error("Something went wrong");
                if (error instanceof AxiosError) {
                    toast.error(error.response?.data.message);
                    console.error(error.response?.data);
                }
                setLoading(false);
            }
        }
    };

    if (status === "authenticated") {
        router.push("/admin/main");
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center  p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 max-w-4xl w-full shadow-2xl rounded-lg overflow-hidden bg-white">
                {/* Left side - Narrative */}
                <div className="bg-slate-50 bg-opacity-90 p-8 flex flex-col justify-center">
                    <div className="text-right space-y-4">
                        <h1 className="text-2xl lg:text-4xl font-bold italic text-slate-800">
                            Perishing Peculiar Pandora Panopticon
                        </h1>
                        <div className="text-sm lg:text-base text-slate-600 space-y-4">
                            <p>
                                While the world was at its end, a group of mysterious
                                spirits approached the neverending stream of wind with
                                chance of gold threads.
                            </p>
                            <p>
                                It wasn&apos;t obvious at first, but soon as they manifested
                                themselves into a single entity, sacrifices were bound
                                to happen.
                            </p>
                            <p className="italic">
                                &ldquo;See you at the other side, Elfrieden...&rdquo;
                            </p>
                            <p>
                                Your Soul Holding my heart and my soul in my both hands,
                                I faced the gate which would take me beyond the
                                dimension a mere human can comprehend...
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right side - Form */}
                <div className="p-8 flex items-center justify-center">
                    <Card className="w-full max-w-md border-0 shadow-none">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">
                                {mode === "login" ? "Welcome Back" : "Create Account"}
                            </CardTitle>
                            <CardDescription>
                                {mode === "login"
                                    ? "Enter your credentials to access your account"
                                    : "Sign up for a new account"
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                                    <p className="text-sm text-slate-600">Signing you in...</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit(submit)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="username">
                                            {mode === "login" ? "Your Dignity" : "Username"}
                                        </Label>
                                        <Input
                                            id="username"
                                            type="text"
                                            {...register("username", { required: "Username is required" })}
                                            className={errors.username || formErrors.username ? "border-red-500" : ""}
                                        />
                                        {(errors.username || formErrors.username) && (
                                            <Alert variant="destructive">
                                                <AlertDescription>
                                                    {errors.username || formErrors.username?.message}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">
                                            {mode === "login" ? "Your Soul" : "Password"}
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            {...register("password", { required: "Password is required" })}
                                            className={errors.password || formErrors.password ? "border-red-500" : ""}
                                        />
                                        {(errors.password || formErrors.password) && (
                                            <Alert variant="destructive">
                                                <AlertDescription>
                                                    {errors.password || formErrors.password?.message}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>

                                    {mode === "signup" && (
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                {...register("confirmPassword", { required: "Please confirm your password" })}
                                                className={formErrors.confirmPassword ? "border-red-500" : ""}
                                            />
                                            {formErrors.confirmPassword && (
                                                <Alert variant="destructive">
                                                    <AlertDescription>
                                                        {formErrors.confirmPassword.message}
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    )}

                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {mode === "login" ? "Login" : "Sign Up"}
                                    </Button>

                                    <Separator className="my-4" />

                                    <div className="text-center text-sm">
                                        {mode === "login" ? (
                                            <>
                                                Do not have an account?{" "}
                                                <button
                                                    type="button"
                                                    className="text-blue-600 hover:text-blue-500 font-medium underline"
                                                    onClick={() => {
                                                        setMode("signup");
                                                        setErrors({});
                                                        reset();
                                                    }}
                                                >
                                                    Sign Up
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                Already have an account?{" "}
                                                <button
                                                    type="button"
                                                    className="text-blue-600 hover:text-blue-500 font-medium underline"
                                                    onClick={() => {
                                                        setMode("login");
                                                        setErrors({});
                                                        reset();
                                                    }}
                                                >
                                                    Login
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}