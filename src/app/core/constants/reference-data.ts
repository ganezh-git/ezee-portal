// ─── Departments (from permit registration4m.php) ─────────────
export const DEPARTMENTS = [
  'EHS',
  'Electrical',
  'Emulsion Block',
  'HR',
  'PEL Lab',
  'Planning',
  'Plant Admin',
  'Raw Material',
  'Packing Material',
  'Finished Goods',
  'Plant Engg',
  'QA',
  'Resin',
  'Safety & Security',
  'SPB Packing',
  'SPB Process',
  'Technical Cell',
  'TRACC',
  'WPB Packing',
  'WPB Process',
  'Security Office',
  'IT',
  'Mechanical',
  'Production',
] as const;

// ─── Designations (from permit registration4m.php) ────────────
// Value is the legacy numeric ID from the permit system
export const DESIGNATIONS: { id: number; label: string }[] = [
  { id: 1, label: 'GWM' },
  { id: 2, label: 'Sr. Manager' },
  { id: 3, label: 'Manager' },
  { id: 4, label: 'Executive' },
  { id: 5, label: 'Engineer' },
  { id: 6, label: 'Sr Officer / Level II' },
  { id: 7, label: 'Officer' },
  { id: 8, label: 'Operator' },
  { id: 9, label: 'Security' },
];

// ─── Roles ────────────────────────────────────────────────────
export const USER_ROLES: { value: string; label: string; description: string; color: string }[] = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full system access, license management, all modules', color: '#dc2626' },
  { value: 'admin', label: 'Admin', description: 'User management, system configuration', color: '#2563eb' },
  { value: 'manager', label: 'Manager', description: 'Department oversight, approval workflows', color: '#d97706' },
  { value: 'user', label: 'User', description: 'Standard module access, create records', color: '#64748b' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access to assigned modules', color: '#94a3b8' },
];

// ─── Super User Permissions Map ──────────────────────────────
// Defines what each role can do in the system
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'admin.access', 'admin.users.create', 'admin.users.edit', 'admin.users.delete',
    'admin.users.reset_password', 'admin.systems.manage', 'admin.audit.view',
    'admin.license.manage', 'admin.company.manage', 'admin.settings',
    'portal.all_modules', 'permit.approve_all', 'permit.override',
  ],
  admin: [
    'admin.access', 'admin.users.create', 'admin.users.edit',
    'admin.users.reset_password', 'admin.systems.manage', 'admin.audit.view',
  ],
  manager: [
    'permit.approve', 'permit.create', 'permit.close',
    'module.export', 'module.reports',
  ],
  user: [
    'permit.create', 'permit.view', 'module.create', 'module.view',
  ],
  viewer: [
    'module.view', 'module.reports',
  ],
};

export type Department = typeof DEPARTMENTS[number];
