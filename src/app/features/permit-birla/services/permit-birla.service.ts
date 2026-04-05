import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  BirlaPermit, BirlaPermitListResponse, PermitType, Department,
  WorkLocation, Personnel, HazardType, PpeType,
} from '../models/permit-birla.models';

export interface BirlaNotification {
  type: 'danger' | 'warning' | 'info';
  icon: string;
  title: string;
  message: string;
  permitId: number;
}

export interface BirlaStats {
  statusCounts: { status: string; count: number }[];
  typeCounts: { code: string; short_label: string; count: number }[];
  dailyCounts: { date: string; count: number }[];
  expiringSoon: any[];
  overdue: any[];
  pendingActions: any[];
  departmentBreakdown: { name: string; code: string; count: number }[];
  monthlyTrend: { month: string; label: string; count: number; closed: number; active: number }[];
}

export interface MyBirlaRole {
  roles: string[];
  personnel: any;
}

@Injectable({ providedIn: 'root' })
export class PermitBirlaService {
  private readonly API = `${environment.apiUrl}/permit-birla`;

  constructor(private http: HttpClient) {}

  // ─── Current User Role ──────────────────────────────────────
  getMyRole(): Observable<MyBirlaRole> {
    return this.http.get<MyBirlaRole>(`${this.API}/my-role`);
  }

  // ─── Stats & Notifications ─────────────────────────────────
  getStats(): Observable<BirlaStats> {
    return this.http.get<BirlaStats>(`${this.API}/stats`);
  }

  getNotifications(): Observable<BirlaNotification[]> {
    return this.http.get<BirlaNotification[]>(`${this.API}/notifications`);
  }

  // ─── Master Data ────────────────────────────────────────────
  getTypes(): Observable<PermitType[]> {
    return this.http.get<PermitType[]>(`${this.API}/types`);
  }
  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.API}/departments`);
  }
  getLocations(): Observable<WorkLocation[]> {
    return this.http.get<WorkLocation[]>(`${this.API}/locations`);
  }
  getPersonnel(role?: string): Observable<Personnel[]> {
    const params = role ? new HttpParams().set('role', role) : undefined;
    return this.http.get<Personnel[]>(`${this.API}/personnel`, { params });
  }
  getHazardTypes(): Observable<HazardType[]> {
    return this.http.get<HazardType[]>(`${this.API}/hazard-types`);
  }
  getPpeTypes(): Observable<PpeType[]> {
    return this.http.get<PpeType[]>(`${this.API}/ppe-types`);
  }

  // ─── Permits ────────────────────────────────────────────────
  getPermits(params: { status?: string; type?: string; department?: string; page?: number; limit?: number } = {}): Observable<BirlaPermitListResponse> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') httpParams = httpParams.set(k, String(v));
    });
    return this.http.get<BirlaPermitListResponse>(`${this.API}/permits`, { params: httpParams });
  }

  getPermit(id: number): Observable<BirlaPermit> {
    return this.http.get<BirlaPermit>(`${this.API}/permits/${id}`);
  }

  createPermit(data: Record<string, any>): Observable<{ id: number; permit_no: string; status: string; message: string }> {
    return this.http.post<{ id: number; permit_no: string; status: string; message: string }>(`${this.API}/permits`, data);
  }

  // ─── Workflow Actions ───────────────────────────────────────
  approve(id: number, role: 'issuer' | 'custodian', person_id: number, signature?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/permits/${id}/approve`, { role, person_id, signature });
  }

  activate(id: number, co_permittee_name: string, signature?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/permits/${id}/activate`, { co_permittee_name, signature });
  }

  close(id: number, data: Record<string, any>): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/permits/${id}/close`, data);
  }

  suspend(id: number, reason: string, suspended_by: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/permits/${id}/suspend`, { reason, suspended_by });
  }

  extend(id: number, data: { extended_until_date: string; extended_until_time: string; custodian_name: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/permits/${id}/extend`, data);
  }

  safetyHold(id: number, reason: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/permits/${id}/safety-hold`, { reason });
  }

  resumePermit(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/permits/${id}/resume`, {});
  }

  // ─── Reports ────────────────────────────────────────────────
  getReportData(params: { from?: string; to?: string; status?: string; type?: string; department?: string } = {}): Observable<any[]> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') httpParams = httpParams.set(k, String(v));
    });
    return this.http.get<{ rows: any[]; total: number }>(`${this.API}/reports/export`, { params: httpParams }).pipe(
      map(res => res.rows)
    );
  }

  downloadReportCsv(params: { from?: string; to?: string; status?: string; type?: string; department?: string } = {}): void {
    let httpParams = new HttpParams().set('format', 'csv');
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') httpParams = httpParams.set(k, String(v));
    });
    const url = `${this.API}/reports/export?${httpParams.toString()}`;
    window.open(url, '_blank');
  }
}
