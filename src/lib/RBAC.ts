import { Role } from "@/app/(admin)/dashboard/main/roles";
import { TUserRoles } from "@/types";

const dp: Record<string, any[]> = {};
export function roleBfs(start: Role, searchItem: TUserRoles) {
    if (dp[start.name]) {
        if (dp[start.name].includes(searchItem)) return true;
        return false;
    }
    const queue = [start];
    const result = [];
    while (queue.length) {
        const current = queue.shift();
        result.push(current?.name);
        if (current?.children.length) {
            queue.push(...current.children);
        }
    }
    dp[start.name] = [...result];
    if (result.includes(searchItem)) return true;
    return false;
}
