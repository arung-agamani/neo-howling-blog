import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export const verifyToken = async (
    req: NextApiRequest,
    res: NextApiResponse,
    next: any
) => {
    const token = req.cookies["token"];
    if (!token) {
        return res.status(403).json({
            message: "No authorization header found",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid token",
        });
    }
};
