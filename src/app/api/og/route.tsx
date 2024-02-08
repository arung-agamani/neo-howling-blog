/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
import { verifyRole } from "@/hooks/useRoleAuth";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { Unauthorized } from "../responses";

export const runtime = "edge";

interface ImageProps {
    title: string | null;
    imageCenter: string | null;
    imageLeft: string | null;
    imageRight: string | null;
    fontSize: string | null;
}

const OGImage: React.FC<ImageProps> = ({
    title = "Lorem Ipsum Dolor",
    imageLeft,
    imageCenter,
    imageRight,
    fontSize,
}) => {
    return (
        <div
            style={{
                display: "flex",
                height: "100%",
                width: "100%",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "slategray",
            }}
        >
            <div
                tw="flex justify-around w-full px-16"
                style={{
                    border: "0px solid red",
                }}
            >
                {imageLeft && <img width="200" height="200" src={imageLeft} />}
                {imageCenter && (
                    <img width="200" height="200" src={imageCenter} />
                )}
                {imageRight && (
                    <img width="200" height="200" src={imageRight} />
                )}
            </div>
            <div
                style={{
                    display: "flex",
                    position: "absolute",
                    bottom: "50px",
                    left: "50px",
                }}
            >
                <h1
                    tw="flex text-white font-light w-full text-left"
                    style={{
                        lineHeight: "60%",
                        fontSize: fontSize || "80px",
                    }}
                >
                    {title}
                </h1>
            </div>
        </div>
    );
};

export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }
    const searchParams = req.nextUrl.searchParams;
    const title = searchParams.get("title");
    const imageLeft = searchParams.get("imageLeft");
    const imageCenter = searchParams.get("imageCenter");
    const imageRight = searchParams.get("imageRight");
    const fontSize = searchParams.get("fontSize");
    return new ImageResponse(
        (
            <OGImage
                {...{ title, imageLeft, imageCenter, imageRight, fontSize }}
            />
        ),
        {
            width: 1200,
            height: 630,
        },
    );
}
