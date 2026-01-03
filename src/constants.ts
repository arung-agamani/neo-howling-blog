/**
 * Shared constants for the application
 */

/**
 * AWS S3 bucket base URL for uploaded assets
 */
export const S3_BUCKET_BASE_URL =
    "https://howling-blog-uploads.s3.ap-southeast-1.amazonaws.com";

/**
 * Build the full S3 URL for an uploaded file
 */
export function buildS3Url(
    year: number,
    month: number,
    day: number,
    filename: string,
): string {
    return `${S3_BUCKET_BASE_URL}/${year}/${month}/${day}/${filename}`;
}

/**
 * Height of the app bar/navbar in pixels
 */
export const APP_BAR_HEIGHT = 64;
