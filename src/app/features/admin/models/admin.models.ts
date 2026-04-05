export interface AdminUser {
  id: number;
  username: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  designation: string | null;
  company_id: number | null;
  location_id: number | null;
  role: string;
  user_type: string;
  is_active: number;
  access_expires_at: string | null;
  last_login: string | null;
  created_at: string;
  managed_by: number | null;
}

export interface AdminUserDetail {
  user: AdminUser;
  systems: UserSystemAssignment[];
}

export interface UserSystemAssignment {
  id: number;
  user_id: number;
  system_id: number;
  system_slug: string;
  system_name: string;
  is_active: number;
  access_start: string | null;
  access_end: string | null;
}

export interface AdminSystem {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: number;
  sort_order: number;
}

export interface AdminCompany {
  id: number;
  name: string;
  short_name: string;
  city: string;
  state: string;
  is_active: number;
}

export interface AdminLocation {
  id: number;
  company_id: number;
  name: string;
  code: string;
  city: string;
  is_active: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  tempUsers: number;
  totalSystems: number;
  totalCompanies: number;
  recentLogins24h: number;
  auditEvents7d: number;
  systemCounts: { slug: string; name: string; user_count: number }[];
  recentLoginList: { username: string; full_name: string; last_login: string }[];
}

export interface AuditLogEntry {
  id: number;
  user_id: number;
  username: string;
  action: string;
  entity_type: string;
  entity_id: number;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  [key: string]: any;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  full_name: string;
  email?: string;
  phone?: string;
  department?: string;
  designation?: string;
  company_id?: number | null;
  location_id?: number | null;
  role?: string;
  user_type?: string;
  access_expires_at?: string | null;
  systems?: number[];
}
