import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DashboardStats, AdminUser, AdminUserDetail, AdminSystem,
  AdminCompany, AdminLocation, AuditLogEntry, CreateUserRequest,
} from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  // Dashboard
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API}/stats`);
  }

  // Users
  getUsers(params: { search?: string; role?: string; status?: string; page?: number; limit?: number } = {}): Observable<{ users: AdminUser[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.role) httpParams = httpParams.set('role', params.role);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    return this.http.get<{ users: AdminUser[]; total: number; page: number; limit: number }>(`${this.API}/users`, { params: httpParams });
  }

  getUser(id: number): Observable<AdminUserDetail> {
    return this.http.get<AdminUserDetail>(`${this.API}/users/${id}`);
  }

  createUser(data: CreateUserRequest): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(`${this.API}/users`, data);
  }

  updateUser(id: number, data: Partial<AdminUser>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API}/users/${id}`, data);
  }

  resetPassword(id: number, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/users/${id}/reset-password`, { password });
  }

  updateUserSystems(userId: number, systemIds: number[]): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API}/users/${userId}/systems`, { systems: systemIds });
  }

  // Systems
  getSystems(): Observable<AdminSystem[]> {
    return this.http.get<AdminSystem[]>(`${this.API}/systems`);
  }

  // Companies & Locations
  getCompanies(): Observable<AdminCompany[]> {
    return this.http.get<AdminCompany[]>(`${this.API}/companies`);
  }

  getLocations(): Observable<AdminLocation[]> {
    return this.http.get<AdminLocation[]>(`${this.API}/locations`);
  }

  // Login Log
  getLoginLog(params: { search?: string; action?: string; success?: string; page?: number; limit?: number; from?: string; to?: string } = {}): Observable<{ logs: any[]; total: number; page: number; limit: number; stats: any }> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') httpParams = httpParams.set(k, String(v)); });
    return this.http.get<any>(`${this.API}/login-log`, { params: httpParams });
  }

  // Audit Log
  getAuditLog(params: { page?: number; limit?: number; action?: string; user_id?: number } = {}): Observable<{ logs: AuditLogEntry[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.action) httpParams = httpParams.set('action', params.action);
    if (params.user_id) httpParams = httpParams.set('user_id', params.user_id.toString());
    return this.http.get<{ logs: AuditLogEntry[]; total: number; page: number; limit: number }>(`${this.API}/audit-log`, { params: httpParams });
  }

}
