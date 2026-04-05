import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Permit, PermitDashboard, PermitListResponse, PermitType,
  PermitLocation, Holiday, ReportResponse, PermitAnalytics,
  CreatePermitRequest, ConfirmPermitRequest,
} from '../models/permit.models';

@Injectable({ providedIn: 'root' })
export class PermitService {
  private readonly API = `${environment.apiUrl}/permit`;

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboard(): Observable<PermitDashboard> {
    return this.http.get<PermitDashboard>(`${this.API}/dashboard`);
  }

  // Permit Types
  getTypes(): Observable<PermitType[]> {
    return this.http.get<PermitType[]>(`${this.API}/types`);
  }

  // Permits CRUD
  getPermits(params: {
    type?: string; status?: string; mode?: string;
    department?: string; search?: string; page?: number; limit?: number;
  } = {}): Observable<PermitListResponse> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') httpParams = httpParams.set(key, String(val));
    });
    return this.http.get<PermitListResponse>(`${this.API}/permits`, { params: httpParams });
  }

  getPermit(type: string, id: number): Observable<Permit> {
    return this.http.get<Permit>(`${this.API}/permits/${type}/${id}`);
  }

  createPermit(data: CreatePermitRequest): Observable<{ id: number; type: string; status: string; message: string }> {
    return this.http.post<{ id: number; type: string; status: string; message: string }>(`${this.API}/permits`, data);
  }

  confirmPermit(type: string, id: number, data: ConfirmPermitRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/permits/${type}/${id}/confirm`, data);
  }

  // My permits
  getMyPermits(): Observable<Permit[]> {
    return this.http.get<Permit[]>(`${this.API}/my-permits`);
  }

  // Approvals
  getApprovals(scope: 'department' | 'all' | 'gwm' | 'unplanned' = 'department'): Observable<Permit[]> {
    return this.http.get<Permit[]>(`${this.API}/approvals`, { params: { scope } });
  }

  approvePermit(type: string, id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/approvals/${type}/${id}/approve`, {});
  }

  rejectPermit(type: string, id: number, remark?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/approvals/${type}/${id}/reject`, { remark });
  }

  // Security
  getSecurityPermits(): Observable<Permit[]> {
    return this.http.get<Permit[]>(`${this.API}/security`);
  }

  closePermit(type: string, id: number, data: { returnStatus: string; securityName: string; remarks?: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/security/${type}/${id}/close`, data);
  }

  // Safety
  getLockedPermits(): Observable<Permit[]> {
    return this.http.get<Permit[]>(`${this.API}/safety/locked`);
  }

  unlockPermit(type: string, id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/safety/${type}/${id}/unlock`, {});
  }

  // Locations
  getLocations(): Observable<PermitLocation[]> {
    return this.http.get<PermitLocation[]>(`${this.API}/locations`);
  }

  addLocation(name: string, department?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/locations`, { name, department });
  }

  lockLocation(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API}/locations/${id}/lock`, {});
  }

  unlockLocation(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API}/locations/${id}/unlock`, {});
  }

  // Holidays
  getHolidays(): Observable<Holiday[]> {
    return this.http.get<Holiday[]>(`${this.API}/holidays`);
  }

  addHoliday(date: string, description?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/holidays`, { date, description });
  }

  removeHoliday(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API}/holidays/${id}`);
  }

  // Reports
  getReport(params: {
    permitType?: string; status?: string; mode?: string;
    department?: string; startDate?: string; endDate?: string;
  }): Observable<ReportResponse> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') httpParams = httpParams.set(key, String(val));
    });
    return this.http.get<ReportResponse>(`${this.API}/reports`, { params: httpParams });
  }

  // Analytics
  getAnalytics(): Observable<PermitAnalytics> {
    return this.http.get<PermitAnalytics>(`${this.API}/analytics`);
  }
}
