import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// ─── Interfaces ────────────────────────────────────────────────

export interface Visit {
  id: number; visit_no: string;
  visitor_name: string; visitor_company: string; visitor_phone: string; visitor_email: string;
  visitor_type: string; visitor_count: number;
  id_type: string; id_number: string;
  photo_data: string; id_proof_data: string; address_proof_data: string;
  purpose: string; visit_date: string; visit_date_to: string;
  expected_arrival: string; expected_departure: string;
  meeting_room: string; items_carried: string; vehicle_no: string;
  host_name: string; host_department: string; host_phone: string; host_email: string;
  booked_by: string; booked_by_id: number; booked_by_role: string;
  requires_approval: boolean; approval_status: string;
  approved_by: string; approved_at: string; approval_remarks: string;
  bypass_approval: boolean; bypass_reason: string;
  entry_time: string; entry_by: string; entry_gate: string; badge_no: string;
  exit_time: string; exit_by: string; exit_gate: string;
  tentative_exit_time: string; exit_acknowledged_by: string; exit_acknowledged_at: string;
  pass_no: string; special_instructions: string; remarks: string;
  nda_signed: boolean; covid_declaration: boolean;
  wifi_code: string; emergency_contact: string;
  status: string; cancel_reason: string;
  created_at: string; updated_at: string;
  groups?: VisitGroup[]; logs?: LogEntry[];
}

export interface VisitGroup {
  id: number; visit_id: number; name: string; company: string;
  phone: string; id_type: string; id_number: string;
}

export interface LogEntry {
  id: number; visit_id: number; visitor_name: string;
  action: string; details: string; performed_by: string; performed_at: string;
}

export interface WatchlistEntry {
  id: number; visitor_name: string; company: string; phone: string;
  reason: string; priority: string; added_by: string; added_at: string;
}

export interface BlacklistEntry {
  id: number; visitor_name: string; company: string; phone: string;
  id_number: string; reason: string; severity: string;
  blacklisted_by: string; blacklisted_at: string;
}

export interface Gate { id: number; name: string; location: string; is_active: boolean; }

export interface DashboardStats {
  todayExpected: number; currentlyInside: number; pendingApprovals: number;
  checkedInToday: number; checkedOutToday: number; noShowToday: number;
  overdue: Visit[]; pendingList: Visit[]; checkInQueue: Visit[]; insideList: Visit[];
}

export interface Analytics {
  from: string; to: string;
  dailyCounts: { date: string; count: number; headcount: number }[];
  typeBreakdown: { visitor_type: string; count: number }[];
  deptBreakdown: { host_department: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  approvalStats: { approved: number; rejected: number; bypassed: number; pending: number };
  peakHours: { hour: number; count: number }[];
  topHosts: { host_name: string; host_department: string; count: number }[];
  securityActivity: { performed_by: string; action: string; count: number }[];
  avgDurationMinutes: number; totalVisits: number; totalHeadcount: number;
}

export interface UserProfile { fullName: string; department: string; }

// ─── Service ───────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class VisitorService {
  private readonly API = `${environment.apiUrl}/visitor`;

  constructor(private http: HttpClient) {}

  // Profile & Lookup
  getMyProfile(): Observable<UserProfile> { return this.http.get<UserProfile>(`${this.API}/my-profile`); }
  lookupByPhone(phone: string): Observable<{ found: boolean; visitor?: any }> {
    return this.http.get<any>(`${this.API}/lookup`, { params: { phone } });
  }

  // Dashboard & Analytics
  getStats(): Observable<DashboardStats> { return this.http.get<DashboardStats>(`${this.API}/stats`); }
  getAnalytics(from: string, to: string): Observable<Analytics> {
    return this.http.get<Analytics>(`${this.API}/analytics`, { params: { from, to } });
  }

  // Visits
  getVisits(params: Record<string, string> = {}): Observable<Visit[]> {
    let hp = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) hp = hp.set(k, v); });
    return this.http.get<Visit[]>(`${this.API}/visits`, { params: hp });
  }
  getVisit(id: number): Observable<Visit> { return this.http.get<Visit>(`${this.API}/visits/${id}`); }
  bookVisit(data: any): Observable<{ id: number; visit_no: string; status: string }> {
    return this.http.post<any>(`${this.API}/visits`, data);
  }
  updateVisit(id: number, data: any): Observable<{ success: boolean }> {
    return this.http.put<any>(`${this.API}/visits/${id}`, data);
  }

  // Lifecycle
  approve(id: number, action: string, remarks?: string): Observable<any> {
    return this.http.post(`${this.API}/visits/${id}/approve`, { action, remarks });
  }
  checkin(id: number, data: any): Observable<{ success: boolean; badge_no: string; pass_no: string }> {
    return this.http.post<any>(`${this.API}/visits/${id}/checkin`, data);
  }
  acknowledgeExit(id: number, tentativeTime?: string): Observable<any> {
    return this.http.post(`${this.API}/visits/${id}/acknowledge-exit`, { tentative_exit_time: tentativeTime });
  }
  checkout(id: number, exitGate?: string, remarks?: string): Observable<any> {
    return this.http.post(`${this.API}/visits/${id}/checkout`, { exit_gate: exitGate, remarks });
  }
  cancel(id: number, reason?: string): Observable<any> {
    return this.http.post(`${this.API}/visits/${id}/cancel`, { reason });
  }
  markNoShow(id: number): Observable<any> {
    return this.http.post(`${this.API}/visits/${id}/no-show`, {});
  }
  block(id: number, reason: string, severity?: string): Observable<any> {
    return this.http.post(`${this.API}/visits/${id}/block`, { reason, severity: severity || 'high' });
  }

  // Convenience
  getPendingApprovals(dept?: string): Observable<Visit[]> {
    let hp = new HttpParams();
    if (dept) hp = hp.set('department', dept);
    return this.http.get<Visit[]>(`${this.API}/pending-approvals`, { params: hp });
  }
  getCheckInQueue(): Observable<Visit[]> { return this.http.get<Visit[]>(`${this.API}/check-in-queue`); }
  getCurrentlyInside(): Observable<Visit[]> { return this.http.get<Visit[]>(`${this.API}/currently-inside`); }
  getUpcomingVisitors(): Observable<Visit[]> { return this.http.get<Visit[]>(`${this.API}/upcoming-visitors`); }
  getMyVisitors(dept?: string): Observable<Visit[]> {
    let hp = new HttpParams();
    if (dept) hp = hp.set('department', dept);
    return this.http.get<Visit[]>(`${this.API}/my-visitors`, { params: hp });
  }

  // Watchlist & Blacklist
  getWatchlist(): Observable<WatchlistEntry[]> { return this.http.get<WatchlistEntry[]>(`${this.API}/watchlist`); }
  addToWatchlist(data: any): Observable<any> { return this.http.post(`${this.API}/watchlist`, data); }
  removeFromWatchlist(id: number): Observable<any> { return this.http.delete(`${this.API}/watchlist/${id}`); }
  getBlacklist(): Observable<BlacklistEntry[]> { return this.http.get<BlacklistEntry[]>(`${this.API}/blacklist`); }
  addToBlacklist(data: any): Observable<any> { return this.http.post(`${this.API}/blacklist`, data); }
  removeFromBlacklist(id: number): Observable<any> { return this.http.delete(`${this.API}/blacklist/${id}`); }

  // Gates, Settings, Log
  getGates(): Observable<Gate[]> { return this.http.get<Gate[]>(`${this.API}/gates`); }
  getSettings(): Observable<Record<string, string>> { return this.http.get<Record<string, string>>(`${this.API}/settings`); }
  updateSettings(s: Record<string, string>): Observable<any> { return this.http.put(`${this.API}/settings`, s); }
  getLog(limit?: number, from?: string, to?: string): Observable<LogEntry[]> {
    let hp = new HttpParams();
    if (limit) hp = hp.set('limit', limit);
    if (from) hp = hp.set('from', from);
    if (to) hp = hp.set('to', to);
    return this.http.get<LogEntry[]>(`${this.API}/log`, { params: hp });
  }
}
