// User model matching portal.users table
export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  department: string | null;
  designation: string | null;
  role: UserRole;
  userType: 'permanent' | 'temporary';
  companyId: number | null;
  locationId: number | null;
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer';

export interface LoginRequest {
  username: string;
  password: string;
  module?: string; // For permit dual-login
}

export interface LoginResponse {
  token: string;
  user: User;
  migrated?: boolean; // True if legacy permit user was auto-migrated
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  systems: string[];
  systemAdmin: string[];
}

export interface SystemAccess {
  slug: string;
  name: string;
  icon: string;
  description: string;
  route: string;
  color: string;
}

// All available systems in the portal
export const PORTAL_SYSTEMS: SystemAccess[] = [
  { slug: 'permit', name: 'Asian Paints PTW', icon: 'assignment', description: 'Asian Paints Permit-to-Work management', route: '/permit', color: '#3b82f6' },
  { slug: 'permit-birla', name: 'Birla Opus PTW', icon: 'verified_user', description: 'Birla Opus Permit-to-Work system', route: '/permit-birla', color: '#e65100' },
  { slug: 'inventory', name: 'Inventory', icon: 'inventory_2', description: 'Purchase orders, RFQ, ASN & invoicing', route: '/inventory', color: '#8b5cf6' },
  { slug: 'vehicle', name: 'Vehicle', icon: 'local_shipping', description: 'Gate entry, dock & fleet management', route: '/vehicle', color: '#06b6d4' },
  { slug: 'safety', name: 'Safety', icon: 'health_and_safety', description: 'Incident tracking, audits & training', route: '/safety', color: '#10b981' },
  { slug: 'visitor', name: 'Visitor', icon: 'badge', description: 'Pre-approved visits, passes & tracking', route: '/visitor', color: '#f59e0b' },
  { slug: 'reception', name: 'Reception', icon: 'meeting_room', description: 'Front desk & lobby management', route: '/reception', color: '#f43f5e' },
  { slug: 'stationery', name: 'Stationery', icon: 'edit_note', description: 'Office supplies request & tracking', route: '/stationery', color: '#ec4899' },
  { slug: 'library', name: 'Library', icon: 'auto_stories', description: 'Catalog, circulation & member management', route: '/library', color: '#0ea5a3' },
];
