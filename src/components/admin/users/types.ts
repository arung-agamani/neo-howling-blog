export interface User {
    id: string;
    username: string;
    name?: string;
    email?: string;
    role: string;
    birthday?: string;
    gender?: string;
    phone?: string;
    avatarUrl?: string;
    bio?: string;
    dateCreated?: string;
    lastAccess?: string;
}

export type UserRole = "admin" | "editor" | "user" | "guest";

export type FilterRole = "all" | UserRole;

export interface UsersPageProps {
    users: User[];
    loading: boolean;
    error: string | null;
    searchTerm: string;
    filterRole: FilterRole;
    onSearchChange: (term: string) => void;
    onFilterChange: (role: FilterRole) => void;
}

export interface UsersStatsProps {
    users: User[];
}

export interface UsersTableProps {
    users: User[];
    searchTerm: string;
    filterRole: FilterRole;
}

export interface UserCardProps {
    user: User;
}

export interface UsersFiltersProps {
    searchTerm: string;
    filterRole: FilterRole;
    onSearchChange: (term: string) => void;
    onFilterChange: (role: FilterRole) => void;
}
