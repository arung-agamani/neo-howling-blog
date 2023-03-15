import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { verifyToken } from "@/utils/jwt";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(verifyToken);

router.get((req, res) => {
    return res.json({
        message: "Dashbaord page",
    });
});

export default router.handler();
