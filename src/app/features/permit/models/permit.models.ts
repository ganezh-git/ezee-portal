// ─── Permit System Models ──────────────────────────────────────

export interface PermitType {
  value: string;
  label: string;
  icon: string;
  color: string;
  gwmRequired: boolean;
}

export interface Permit {
  id: number;
  type: string;
  typeLabel: string;
  typeIcon: string;
  typeColor: string;
  requestDate: string;
  requestTime: string;
  location: string;
  description: string;
  expectedStart: string;
  expectedEnd: string;
  mode: string;
  modeCode: string;
  status: string;
  issueStatus: string;
  permitNumber: string;
  department: string;
  permitOwner: string;
  permitOwner2: string;
  permitOwner3: string;
  permitUser1: string;
  permitUser2: string;
  permitUser3: string;
  lotoRequired: string;
  lotoReturned: string;
  ladderRequired: string;
  ladderReturned: string;
  fireGuard: string;
  checklist: { c1: string; c2: string; c3: string; c4: string; c5: string; c6: string; c7: string };
  issueDate: string;
  issueTime: string;
  closedBy: string;
  closeDate: string;
  closeTime: string;
  securityName: string;
  securityCloseDate: string;
  securityCloseTime: string;
  securityReturn: string;
  remarks: string;
  securityRemarks: string;
  closureComment: string;
  managerApprovalTime: string;
  gwmApproval: string;
  holidayApproval: number;
}

export interface PermitDashboard {
  stats: {
    approved: number;
    waiting: number;
    raised: number;
    locked: number;
    active: number;
  };
  typeCounts: Record<string, number>;
  modeCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  recentPermits: Permit[];
}

export interface PermitListResponse {
  permits: Permit[];
  total: number;
  page: number;
  limit: number;
}

export interface PermitLocation {
  id: number;
  loc: string;
  locks: string;
  dept: string;
}

export interface Holiday {
  id: number;
  holiday_date: string;
  description: string;
}

export interface ReportResponse {
  permits: Permit[];
  total: number;
  summary: {
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byMode: Record<string, number>;
  };
}

export interface CreatePermitRequest {
  type: string;
  location: string;
  description: string;
  expectedStart: string;
  expectedEnd: string;
  mode: string;
  fireGuard?: string;
}

export interface ConfirmPermitRequest {
  permitNumber: string;
  permitOwner2?: string;
  permitOwner3?: string;
  permitUser1?: string;
  permitUser2?: string;
  permitUser3?: string;
  loto?: string;
  ladder?: string;
  c1?: string; c2?: string; c3?: string; c4?: string; c5?: string; c6?: string; c7?: string;
  remarks?: string;
}

// Status for UI rendering
export const PERMIT_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  'Waiting for Dept. Mgr Approval': { label: 'Awaiting Manager', color: '#d97706', bgColor: '#fef3c7', icon: 'hourglass_top' },
  'Waiting for Sr. Mgr Approval': { label: 'Awaiting Sr. Manager', color: '#d97706', bgColor: '#fef3c7', icon: 'hourglass_top' },
  'Waiting for GWM Approval': { label: 'Awaiting GWM', color: '#ea580c', bgColor: '#ffedd5', icon: 'hourglass_top' },
  'Permit Pending for Confirm': { label: 'Pending Confirmation', color: '#2563eb', bgColor: '#dbeafe', icon: 'pending' },
  'Printable and permit to be surrender': { label: 'Active', color: '#16a34a', bgColor: '#dcfce7', icon: 'play_circle' },
  'Permit Returned': { label: 'Returned', color: '#64748b', bgColor: '#f1f5f9', icon: 'check_circle' },
  'Locked': { label: 'Locked', color: '#dc2626', bgColor: '#fef2f2', icon: 'lock' },
  'Permit Returned with NC': { label: 'Non-Compliance', color: '#dc2626', bgColor: '#fef2f2', icon: 'warning' },
  'Lock Released': { label: 'Lock Released', color: '#16a34a', bgColor: '#dcfce7', icon: 'lock_open' },
  'Cancelled': { label: 'Cancelled', color: '#64748b', bgColor: '#f1f5f9', icon: 'cancel' },
};

export const PERMIT_MODE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  'N': { label: 'Normal', color: '#3b82f6', icon: 'schedule' },
  'B': { label: 'Breakdown', color: '#f97316', icon: 'bolt' },
  'U': { label: 'Unplanned', color: '#ef4444', icon: 'priority_high' },
};
