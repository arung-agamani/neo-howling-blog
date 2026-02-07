// ── Scope Definitions ──────────────────────────────────────────

export const AVAILABLE_SCOPES: Record<string, string> = {
    "assets:read": "Read/list assets and files",
    "assets:write": "Upload new assets",
    "assets:delete": "Delete assets",
    "assets:*": "Full access to assets",
};

// ── Date / Time Helpers ────────────────────────────────────────

export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString();
}

export function relativeTime(dateStr: string | null | undefined): string {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export function isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
}

// ── Status / Method Color Helpers ──────────────────────────────

export function methodColor(
    method: string,
): "primary" | "success" | "error" | "warning" | "info" | "default" {
    switch (method.toUpperCase()) {
        case "GET":
            return "success";
        case "POST":
            return "primary";
        case "DELETE":
            return "error";
        case "PUT":
        case "PATCH":
            return "warning";
        default:
            return "default";
    }
}

export function statusColor(code: number): "success" | "error" | "warning" {
    if (code >= 200 && code < 300) return "success";
    if (code >= 400 && code < 500) return "warning";
    return "error";
}

// ── Expiration Presets ─────────────────────────────────────────

export type ExpirationPreset =
    | "30d"
    | "90d"
    | "180d"
    | "365d"
    | "never"
    | "custom";

export function getExpirationDate(preset: ExpirationPreset): string | null {
    if (preset === "never" || preset === "custom") return null;
    const now = new Date();
    switch (preset) {
        case "30d":
            now.setDate(now.getDate() + 30);
            break;
        case "90d":
            now.setDate(now.getDate() + 90);
            break;
        case "180d":
            now.setDate(now.getDate() + 180);
            break;
        case "365d":
            now.setDate(now.getDate() + 365);
            break;
    }
    return now.toISOString();
}
