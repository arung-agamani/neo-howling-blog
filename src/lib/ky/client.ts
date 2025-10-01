import ky, { HTTPError } from "ky";

// Create a base ky instance for admin API calls
export const adminApi = ky.create({
    prefixUrl: "/api/v1",
    timeout: 30000, // 30 seconds
    retry: {
        limit: 3,
        methods: ["get"],
        statusCodes: [408, 413, 429, 500, 502, 503, 504],
        backoffLimit: 3000,
    },
    hooks: {
        beforeRequest: [
            (request) => {
                // Log requests in development
                if (process.env.NODE_ENV === "development") {
                    console.log(`${request.method} ${request.url}`);
                }
            },
        ],
        beforeError: [
            (error) => {
                const { request, response } = error;

                // Log errors in development
                if (process.env.NODE_ENV === "development") {
                    console.error(
                        `Error ${response?.status} for ${request.url}:`,
                        error,
                    );
                }

                // Handle specific error cases
                if (response?.status === 401) {
                    // Unauthorized - redirect to login if not already there
                    if (
                        typeof window !== "undefined" &&
                        !window.location.pathname.includes("/admin/login")
                    ) {
                        window.location.assign("/admin");
                    }
                }

                return error;
            },
        ],
        afterResponse: [
            async (request, options, response) => {
                // Log successful responses in development
                if (process.env.NODE_ENV === "development") {
                    console.log(`${response.status} ${request.url}`);
                }

                return response;
            },
        ],
    },
});

// Helper function to handle ky errors and convert to standard error format
export const handleKyError = (error: unknown): Error => {
    if (error instanceof HTTPError) {
        const statusCode = error.response.status;
        const statusText = error.response.statusText;

        // Create a more descriptive error message
        let message = `Request failed with status ${statusCode}`;

        if (statusText) {
            message += `: ${statusText}`;
        }

        const customError = new Error(message) as Error & {
            status?: number;
            response?: Response;
        };
        customError.status = statusCode;
        customError.response = error.response;

        return customError;
    }

    if (error instanceof Error) {
        return error;
    }

    return new Error("An unknown error occurred");
};

// Helper function to parse JSON response with error handling
export const parseJsonResponse = async <T>(response: Response): Promise<T> => {
    try {
        return await response.json();
    } catch (error) {
        throw new Error("Failed to parse response as JSON");
    }
};

// Type-safe wrapper for GET requests
export const get = async <T>(url: string): Promise<T> => {
    try {
        const response = await adminApi.get(url);
        return await parseJsonResponse<T>(response);
    } catch (error) {
        throw handleKyError(error);
    }
};

// Type-safe wrapper for POST requests
export const post = async <T>(url: string, data?: unknown): Promise<T> => {
    try {
        const response = await adminApi.post(url, {
            json: data,
        });
        return await parseJsonResponse<T>(response);
    } catch (error) {
        throw handleKyError(error);
    }
};

// Type-safe wrapper for PUT requests
export const put = async <T>(url: string, data?: unknown): Promise<T> => {
    try {
        const response = await adminApi.put(url, {
            json: data,
        });
        return await parseJsonResponse<T>(response);
    } catch (error) {
        throw handleKyError(error);
    }
};

// Type-safe wrapper for PATCH requests
export const patch = async <T>(url: string, data?: unknown): Promise<T> => {
    try {
        const response = await adminApi.patch(url, {
            json: data,
        });
        return await parseJsonResponse<T>(response);
    } catch (error) {
        throw handleKyError(error);
    }
};

// Type-safe wrapper for DELETE requests
export const del = async <T = void>(url: string): Promise<T> => {
    try {
        const response = await adminApi.delete(url);

        // If response has no content, return undefined
        if (
            response.status === 204 ||
            !response.headers.get("content-type")?.includes("application/json")
        ) {
            return undefined as T;
        }

        return await parseJsonResponse<T>(response);
    } catch (error) {
        throw handleKyError(error);
    }
};

// Export the main client for direct use if needed
export default adminApi;
