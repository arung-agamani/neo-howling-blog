"use client";

import { Button } from "@mui/material";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const ReprocessTagsButton: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const queryClient = useQueryClient();

    const handleReprocessTags = async () => {
        setIsProcessing(true);
        try {
            const response = await fetch("/api/dashboardv2/tag/process", {
                method: "POST",
            });
            if (!response.ok) {
                throw new Error("Failed to reprocess tags");
            }
            alert("Tags reprocessed successfully!");
            // Refetch tags query
            queryClient.invalidateQueries({ queryKey: ["tags"] });
        } catch (error) {
            console.error(error);
            alert("An error occurred while reprocessing tags.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Button
            variant="contained"
            color="primary"
            onClick={handleReprocessTags}
            disabled={isProcessing}
        >
            {isProcessing ? "Processing..." : "Reprocess Tags"}
        </Button>
    );
};

export default ReprocessTagsButton;
