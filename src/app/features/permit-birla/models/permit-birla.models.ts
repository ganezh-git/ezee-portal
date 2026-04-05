// ─── Birla Opus Permit-to-Work Models ────────────────────────────

export interface PermitType {
  id: number;
  code: string;
  doc_id: string;
  label: string;
  short_label: string;
  description: string;
  requires_fire_watcher: boolean;
  requires_gas_test: boolean;
  requires_scaffolding_checklist: boolean;
  requires_lifting_plan: boolean;
  sunday_restricted: boolean;
}

export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface WorkLocation {
  id: number;
  name: string;
  area: string;
  department_id: number;
  department_name: string;
}

export interface Personnel {
  id: number;
  emp_code: string;
  name: string;
  designation: string;
  department_id: number;
  department_name: string;
  mobile: string;
  experience_years: number;
  exam_score: number;
  is_initiator: boolean;
  is_issuer: boolean;
  is_custodian: boolean;
  is_isolator: boolean;
  isolator_discipline: string;
  is_fire_watcher: boolean;
  is_co_permittee: boolean;
}

export interface HazardType {
  id: number;
  code: string;
  label: string;
  category: string;
}

export interface PpeType {
  id: number;
  code: string;
  label: string;
}

export interface AuditLogEntry {
  id: number;
  permit_id: number;
  action: string;
  details: string;
  performed_by: string;
  performed_at: string;
}

export type PermitStatus =
  | 'Draft' | 'Initiated' | 'Issued' | 'Custodian_Approved'
  | 'Active' | 'Suspended' | 'Extended' | 'Closure_Initiated' | 'Closed' | 'Cancelled';

export interface BirlaPermit {
  id: number;
  permit_no: string;
  serial_no: string;
  permit_type_id: number;
  type_code: string;
  type_label: string;
  short_label: string;
  doc_id: string;
  requires_fire_watcher: boolean;
  requires_gas_test: boolean;
  department_id: number;
  department_name: string;
  location_id: number;
  location_name: string;
  location_text: string;
  is_project: boolean;
  cross_ref: string;
  issued_date: string;
  issued_time: string;
  valid_until_date: string;
  valid_until_time: string;
  work_description: string;
  has_additional_permit: boolean;
  additional_permit_details: string;
  specific_hazards: string;
  // Isolation
  isolation_electrical: 'YES' | 'NA';
  isolation_electrical_drive: string;
  isolation_electrical_how: string;
  isolation_services: 'YES' | 'NA';
  isolation_services_type: string;
  isolation_services_how: string;
  isolation_process: 'YES' | 'NA';
  isolation_process_equip: string;
  isolation_process_how: string;
  isolation_requested_by: string;
  lototo_owner_name: string;
  // Additional
  additional_precautions: string;
  fire_watcher_name: string;
  fire_watcher_mobile: string;
  working_group_members: string;
  // Status
  status: PermitStatus;
  suspension_reason: string;
  suspended_by: string;
  suspended_at: string;
  extended_until_date: string;
  extended_until_time: string;
  extended_by_custodian: string;
  // Signatories
  initiator_id: number;
  initiator_name: string;
  initiator_designation: string;
  initiator_signed_at: string;
  issuer_id: number;
  issuer_name: string;
  issuer_designation: string;
  issuer_signed_at: string;
  custodian_id: number;
  custodian_name: string;
  custodian_designation: string;
  custodian_signed_at: string;
  co_permittee_name: string;
  co_permittee_signed_at: string;
  isolator_name: string;
  isolator_designation: string;
  // Closure
  closure_debris_removed: boolean;
  closure_tools_removed: boolean;
  closure_solvent_jumpers: boolean;
  closure_lototo_removed: boolean;
  closure_equipment_ready: boolean;
  closure_area_cordoned: boolean;
  closure_comments: string;
  closure_initiator_signed_at: string;
  closed_at: string;
  created_at: string;
  // Signatures
  initiator_signature: string;
  issuer_signature: string;
  custodian_signature: string;
  co_permittee_signature: string;
  closure_initiator_signature: string;
  // Nested
  hazards: { hazard_type_id: number; code: string; label: string; other_specify: string }[];
  ppe: { ppe_type_id: number; code: string; label: string; harness_id_number: string; other_specify: string }[];
  checklist: { id: number; item_no: number; question: string; status: string; remarks: string; signed_by: string }[];
  auditLog: AuditLogEntry[];
}

export interface BirlaPermitListResponse {
  permits: BirlaPermit[];
  total: number;
  page: number;
  limit: number;
}

export const PERMIT_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  Draft:              { label: 'Draft',              color: '#6b7280', bgColor: '#f3f4f6', icon: 'edit_note' },
  Initiated:          { label: 'Initiated',          color: '#2563eb', bgColor: '#dbeafe', icon: 'send' },
  Issued:             { label: 'Issued',             color: '#7c3aed', bgColor: '#ede9fe', icon: 'how_to_reg' },
  Custodian_Approved: { label: 'Custodian Approved', color: '#059669', bgColor: '#d1fae5', icon: 'verified' },
  Active:             { label: 'Active',             color: '#16a34a', bgColor: '#dcfce7', icon: 'play_circle' },
  Suspended:          { label: 'Suspended',          color: '#dc2626', bgColor: '#fee2e2', icon: 'pause_circle' },
  Extended:           { label: 'Extended',           color: '#d97706', bgColor: '#fef3c7', icon: 'update' },
  Closed:             { label: 'Closed',             color: '#374151', bgColor: '#e5e7eb', icon: 'check_circle' },
  Cancelled:          { label: 'Cancelled',          color: '#991b1b', bgColor: '#fecaca', icon: 'cancel' },
};

export const PERMIT_TYPE_ICONS: Record<string, string> = {
  HEIGHT: 'height', CONFINED: 'sensors', ELECTRICAL: 'bolt', EXCAVATION: 'foundation',
  GENERAL: 'build', LOTOTO: 'lock', LIFTING: 'crane',
  MONOMER_BARREL: 'oil_barrel', MONOMER_TANKER: 'local_shipping', HOT_WORK: 'local_fire_department',
};
