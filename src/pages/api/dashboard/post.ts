import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { verifyToken } from "@/utils/jwt";
import prisma from "@/utils/prisma";

const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(verifyToken);

router.get(async (req, res) => {
    const { id, op } = req.query;
    if (op && op === "list") {
        const pages = await prisma.posts.findMany({
            select: {
                title: true,
                link: true,
                tags: true,
                description: true,
                bannerUrl: true,
                isBannerDark: true,
                isPublished: true,
                datePosted: true,
                id: true,
                updatedAt: true,
                deleted: true,
                deletedAt: true,
            },
            orderBy: {
                datePosted: "desc",
            },
        });
        return res.json({
            message: "success",
            data: pages,
            length: pages.length,
        });
    }
    if (!id) {
        return res.status(400).json({
            message: "Missing id",
        });
    }
    const page = await prisma.posts.findFirst({
        where: {
            id: Array.isArray(id) ? id[0] : id,
        },
    });
    if (!page) {
        return res.status(404).json({
            message: "No post found with given id",
        });
    }
    return res.send({
        message: "Success",
        data: {
            page,
        },
    });
});

router.post(async (req, res) => {
    const { id, op, content, tags } = req.body;

    if (!op) {
        return res.status(400).json({
            message: "Bad request",
        });
    }
    if (op === "update") {
        if (!id || !content)
            return res.status(400).json({
                message: "Bad request",
            });
        const { title, description, bannerUrl } = req.body;
        let updateRes;
        try {
            updateRes = await prisma.posts.update({
                where: {
                    id,
                },
                data: {
                    blogContent: content,
                    title,
                    description,
                    bannerUrl,
                    tags,
                    updatedAt: new Date(),
                },
            });
        } catch (error) {
            return res.status(404).json({
                message: "Record with given id not found",
            });
        }

        if (!updateRes)
            return res.status(500).json({
                message: "Something went wrong when updating the record",
            });

        return res.status(200).json({
            message: "Post updated successfully",
            data: updateRes,
        });
    } else if (op === "publish") {
        if (!id)
            return res.status(400).json({
                message: "Bad request",
            });
        const { publish } = req.body;
        let publishRes;
        try {
            publishRes = await prisma.posts.update({
                where: {
                    id,
                },
                data: {
                    isPublished: publish,
                },
            });
        } catch (error) {
            return res.status(404).json({
                message: "Failed to (un)publish post",
            });
        }

        if (!publishRes)
            return res.status(500).json({
                message: "Something went wrong when (un)publishing the post",
            });

        return res.status(200).json({
            message: "Post (un)published successfully",
            data: publishRes,
        });
    } else if (op === "create") {
        let createRes;

        try {
            const createData = {
                author: req.body.author,
                blogContent: content,
                datePosted: req.body.datePosted,
                description: req.body.description,
                title: req.body.title,
                tags: req.body.tags,
                link: "",
                isPublished: false,
                bannerUrl: req.body.bannerUrl,
            };
            createRes = await prisma.posts.create({
                data: {
                    ...createData,
                    deleted: false,
                    updatedAt: new Date(),
                    deletedAt: new Date(),
                },
            });
        } catch (error) {
            console.log("Error when creating post");
            console.error(error);
        }

        if (!createRes)
            return res.status(500).json({
                message: "Something went wrong when creating the post",
            });

        return res.status(200).json({
            message: "Post created successfully",
            data: createRes,
        });
    } else {
        return res.status(400).json({
            message: "Unsupported operation",
        });
    }
});

router.delete(async (req, res) => {
    const { id } = req.query;
    if (!id) {
        return res.status(400).send({
            message: "Bad request. Missing id",
        });
    }

    let pageDelete;
    let err;
    try {
        pageDelete = await prisma.posts.update({
            where: {
                id: Array.isArray(id) ? id[0] : id,
            },
            data: {
                deleted: true,
            },
        });
    } catch (error) {
        console.log("Error when deleting post with id: " + id);
        console.error(error);
        err = error;
    }

    if (!pageDelete) {
        return res.status(500).send({
            message: "Something went wrong when deleting post",
        });
    }

    return res.status(204).send({
        message: "Post deleted",
    });
});

export default router.handler();
