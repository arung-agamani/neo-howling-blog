export interface ApiKey {
    id: string;
    name: string;
    description: string | null;
    keyPrefix: string;
    scopes: string[];
    createdAt: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    usageCount: number;
    isActive: boolean;
    revokedAt: string | null;
}

export interface UsageLog {
    id: string;
    endpoint: string;
    method: string;
    statusCode: number;
    ipAddress: string | null;
    userAgent: string | null;
    timestamp: string;
}

export interface ApiKeyDetail extends ApiKey {
    usageLogs: UsageLog[];
}

export interface ApiKeyListResponse {
    success: boolean;
    data: ApiKey[];
    count: number;
}

export interface ApiKeyDetailResponse {
    success: boolean;
    data: ApiKeyDetail;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
}

export interface CreateApiKeyResponse {
    success: boolean;
    message: string;
    data: ApiKey & { key: string };
}
