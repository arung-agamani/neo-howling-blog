import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const title = searchParams.get("title") || "Lorem Ipsum";
    const description = searchParams.get("description") || "Dolor Sit Amet";
    const author = searchParams.get("author") || "Shirayuki Haruka";
    return new ImageResponse(
        (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    verticalAlign: "middle",
                    alignItems: "center",
                    height: "100%",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        width: "100%",
                        height: "100%",
                        padding: "3rem",
                        backgroundImage:
                            "linear-gradient(to right bottom, rgb(129, 140, 248), rgb(109, 40, 217))",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            backgroundColor: "white",
                            flexDirection: "column",
                            width: "100%",
                            height: "100%",
                            paddingLeft: "3rem",
                            paddingRight: "3rem",
                            paddingTop: "2rem",
                            paddingBottom: "3rem",
                            borderRadius: "0.75rem",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                gap: "1rem",
                                marginBottom: "1rem",
                                marginTop: "-1rem",
                                alignItems: "center",
                            }}
                        >
                            <svg width={20} height={20}>
                                <circle cx={10} cy={10} r={10} fill="red" />
                            </svg>
                            <svg width={20} height={20}>
                                <circle cx={10} cy={10} r={10} fill="orange" />
                            </svg>
                            <svg width={20} height={20}>
                                <circle cx={10} cy={10} r={10} fill="green" />
                            </svg>
                            <p
                                style={{
                                    fontSize: "1.25rem",
                                }}
                            >
                                Howling Snippets
                            </p>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                flexGrow: "1",
                                justifyContent: "center",
                            }}
                        >
                            <h1
                                style={{
                                    fontWeight: "bold",
                                    fontSize: "6rem",
                                }}
                            >
                                {title}
                            </h1>
                        </div>
                        <span
                            style={{
                                fontSize: "2.25rem",
                                paddingBottom: "2rem",
                                borderBottom: "0.25px solid gray",
                            }}
                        >
                            {description}{" "}
                        </span>
                        <p
                            style={{
                                paddingBottom: "0.5rem",
                            }}
                        >
                            Posted by: {author}
                        </p>
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 632,
        },
    );
}
