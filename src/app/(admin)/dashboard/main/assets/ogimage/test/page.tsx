import React from "react";

const TestPage = () => {
    return (
        <div className="flex justify-center align-middle items-center h-full">
            <div
                className="w-[1200px] h-[630px] p-12 bg-gradient-to-br from-indigo-400 to-violet-700"
                style={{
                    background: "",
                }}
            >
                <div className="w-full h-full bg-white rounded-xl px-12 pb-12 pt-8 flex flex-col">
                    <div className="flex gap-4 mb-4">
                        <svg width={20} height={20}>
                            <circle cx={10} cy={10} r={10} fill="red" />
                        </svg>
                        <svg width={20} height={20}>
                            <circle cx={10} cy={10} r={10} fill="orange" />
                        </svg>
                        <svg width={20} height={20}>
                            <circle cx={10} cy={10} r={10} fill="green" />
                        </svg>
                    </div>
                    <div className="flex-grow flex flex-col h-full justify-center">
                        <span className="font-bold text-8xl">
                            Postgres docker-compose
                        </span>
                    </div>
                    {/* <div className="flex-grow"></div> */}
                    <p className="text-4xl">Description of the snippet</p>
                    <hr />
                    <p className="py-2">Posted by: </p>
                </div>
            </div>
        </div>
    );
};

export default TestPage;
