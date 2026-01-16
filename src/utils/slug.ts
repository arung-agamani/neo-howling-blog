/**
 * Generates a URL-friendly slug from a title string.
 * Supports internationalized characters including Japanese, Chinese, Korean, etc.
 *
 * - Normalizes Unicode characters
 * - Converts fullwidth characters to halfwidth equivalents
 * - Keeps alphanumeric characters (including non-ASCII letters)
 * - Removes special characters that are unsafe in URLs
 * - Replaces spaces with hyphens
 * - Collapses multiple consecutive hyphens into one
 * - Trims leading/trailing hyphens
 */
export function slugFromTitle(title: string): string {
    return (
        title
            // Normalize Unicode characters (NFC form)
            .normalize("NFKC")
            // Convert to lowercase
            .toLowerCase()
            // Replace various whitespace and separator characters with hyphens
            .replace(/[\s\u3000]+/g, "-")
            // Remove characters that are problematic in URLs
            // Keep: Unicode letters (\p{L}), Unicode numbers (\p{N}), marks (\p{M}), hyphens, periods
            // Remove: special chars, punctuation, symbols
            .replace(/[^\p{L}\p{N}\p{M}\-.]/gu, "")
            // Collapse multiple hyphens into one
            .replace(/-+/g, "-")
            // Collapse multiple periods into one
            .replace(/\.+/g, ".")
            // Remove leading/trailing hyphens and periods
            .replace(/^[-.]+|[-.]+$/g, "")
    );
}
