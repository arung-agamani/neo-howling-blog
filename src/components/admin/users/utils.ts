import { User, FilterRole } from "./types";

export const formatDate = (dateString?: string): string => {
    if (!dateString) return "Not provided";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

export const formatPhoneNumber = (phone?: string): string => {
    if (!phone) return "Not provided";
    // Basic phone formatting - adjust based on your needs
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
};

export const filterUsers = (
    users: User[],
    searchTerm: string,
    filterRole: FilterRole
): User[] => {
    return users.filter((user) => {
        const matchesSearch =
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole =
            filterRole === "all" || user.role === filterRole;

        return matchesSearch && matchesRole;
    });
};

export const calculateUserStats = (users: User[]) => {
    const roleStats = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        total: users.length,
        admins: roleStats.admin || 0,
        editors: roleStats.editor || 0,
        users: roleStats.user || 0,
        guests: roleStats.guest || 0,
        withEmail: users.filter(u => u.email).length,
        withPhone: users.filter(u => u.phone).length,
    };
};

export const getDisplayName = (user: User): string => {
    return user.name || user.username || "Unknown User";
};

export const getEmailDisplayText = (email?: string): string => {
    return email || "No email provided";
};

export const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role.toLowerCase()) {
        case "admin":
            return "destructive";
        case "editor":
            return "default";
        case "user":
            return "secondary";
        case "guest":
            return "outline";
        default:
            return "outline";
    }
};

export const getRoleColor = (role: string): string => {
    switch (role.toLowerCase()) {
        case "admin":
            return "text-red-600 bg-red-100";
        case "editor":
            return "text-blue-600 bg-blue-100";
        case "user":
            return "text-green-600 bg-green-100";
        case "guest":
            return "text-gray-600 bg-gray-100";
        default:
            return "text-gray-600 bg-gray-100";
    }
};

export const capitalizeRole = (role: string): string => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
};

export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const getGenderDisplayText = (gender?: string): string => {
    if (!gender) return "Not specified";
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
};
