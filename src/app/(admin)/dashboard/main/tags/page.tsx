import prisma from "@/utils/prisma";
import { Divider, Typography } from "@mui/material";
import ReprocessTagsButton from "./ReprocessTagsButton";
import TagsTable from "./Table";
export default async function TagsPage() {
    const tags = await prisma.tags.findMany({});

    return (
        <div className="bg-white w-full h-full p-8">
            <Typography variant="h3">Tags</Typography>
            <Divider />
            <div className="mt-4">
                <ReprocessTagsButton />
            </div>
            <div className="mt-4">
                <TagsTable tags={tags} />
            </div>
        </div>
    );
}
