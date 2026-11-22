export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

export const getAuthorDisplayName = (author?: string): string => {
    return author || "Unknown Author";
};

export const getDescriptionDisplayText = (description?: string): string => {
    return description || "No description available";
};
