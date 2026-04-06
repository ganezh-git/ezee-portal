import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Incident {
  id: number; incident_no: string; title: string;
  incident_type: string; severity: string;
  incident_date: string; incident_time: string; date_occurred: string;
  location: string; department: string;
  injured_person: string; injury_type: string;
  description: string; immediate_action: string;
  root_cause: string; corrective_action: string; preventive_action: string;
  witness_names: string; investigation_by: string; investigation_date: string;
  reported_by: string; investigated_by: string;
  status: string; photo_path: string;
  closed_at: string; created_at: string;
}

export interface WorkPermit {
  id: number; permit_no: string; permit_type: string;
  title: string; description: string;
  location: string; department: string;
  requested_by: string; contractor_name: string;
  start_date: string; start_time: string;
  end_date: string; end_time: string;
  hazards: string; precautions: string; ppe_required: string;
  approved_by: string; approved_at: string; safety_officer: string;
  status: string; closed_by: string; closed_at: string;
  remarks: string; created_at: string;
}

export interface Inspection {
  id: number; inspection_no: string; inspection_type: string;
  area: string; department: string; inspection_date: string;
  inspector_name: string; findings: string;
  observations: number; non_conformities: number;
  corrective_actions: string; due_date: string;
  overall_score: number; status: string;
  remarks: string; created_at: string;
}

export interface SafetyObservation {
  id: number; observation_type: string;
  location: string; department: string;
  description: string; action_taken: string;
  reported_by: number; status: string; created_at: string;
}

export interface Training {
  id: number; training_no: string; title: string;
  training_type: string; trainer_name: string;
  training_date: string; duration_hours: number;
  location: string; department: string;
  attendees_count: number; attendees: string;
  topics_covered: string; remarks: string;
  status: string; created_at: string;
}

export interface PpeRecord {
  id: number; employee_name: string; employee_id: string;
  department: string; ppe_item: string; quantity: number;
  issue_date: string; expiry_date: string;
  condition_on_issue: string; returned_date: string;
  condition_on_return: string; issued_by: string;
  remarks: string; created_at: string;
}

export interface SafetyAudit {
  id: number; audit_no: string; audit_type: string;
  audit_date: string; department: string; auditor: string;
  score: number; findings: number; critical_findings: number;
  status: string; summary: string; created_at: string;
}

export interface SafetyStats {
  totalIncidents: number; openIncidents: number; criticalIncidents: number;
  daysSinceLastLTI: number;
  activePermits: number; pendingPermits: number;
  completedAudits: number; scheduledAudits: number; avgAuditScore: string;
  upcomingTrainingCount: number; completedTrainings: number;
  totalObservations: number; unsafeObservations: number;
  ppeIssuedThisMonth: number; inspectionsThisMonth: number;
  incidentTrend: any[]; incidentByType: any[]; incidentByDept: any[];
  severityBreakdown: any[]; recentIncidents: Incident[];
  upcomingAudits: SafetyAudit[]; upcomingTrainings: Training[];
  observationTrend: any[];
}

@Injectable({ providedIn: 'root' })
export class SafetyService {
  private readonly API = `${environment.apiUrl}/safety`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<SafetyStats> { return this.http.get<SafetyStats>(`${this.API}/stats`); }

  // Incidents
  getIncidents(params: Record<string, any> = {}): Observable<{ incidents: Incident[]; total: number; page: number }> {
    return this.http.get<any>(`${this.API}/incidents`, { params: this.toParams(params) });
  }
  getIncident(id: number): Observable<Incident> { return this.http.get<Incident>(`${this.API}/incidents/${id}`); }
  createIncident(data: Record<string, any>): Observable<{ id: number; incident_no: string; message: string }> { return this.http.post<any>(`${this.API}/incidents`, data); }
  updateIncident(id: number, data: Record<string, any>): Observable<{ message: string }> { return this.http.put<any>(`${this.API}/incidents/${id}`, data); }

  // Work Permits
  getPermits(params: Record<string, any> = {}): Observable<{ permits: WorkPermit[]; total: number; page: number }> {
    return this.http.get<any>(`${this.API}/permits`, { params: this.toParams(params) });
  }
  getPermit(id: number): Observable<WorkPermit> { return this.http.get<WorkPermit>(`${this.API}/permits/${id}`); }
  createPermit(data: Record<string, any>): Observable<{ id: number; permit_no: string; message: string }> { return this.http.post<any>(`${this.API}/permits`, data); }
  updatePermit(id: number, data: Record<string, any>): Observable<{ message: string }> { return this.http.put<any>(`${this.API}/permits/${id}`, data); }

  // Inspections
  getInspections(params: Record<string, any> = {}): Observable<{ inspections: Inspection[]; total: number; page: number }> {
    return this.http.get<any>(`${this.API}/inspections`, { params: this.toParams(params) });
  }
  createInspection(data: Record<string, any>): Observable<{ id: number; inspection_no: string; message: string }> { return this.http.post<any>(`${this.API}/inspections`, data); }
  updateInspection(id: number, data: Record<string, any>): Observable<{ message: string }> { return this.http.put<any>(`${this.API}/inspections/${id}`, data); }

  // Observations
  getObservations(params: Record<string, any> = {}): Observable<{ observations: SafetyObservation[]; total: number; page: number }> {
    return this.http.get<any>(`${this.API}/observations`, { params: this.toParams(params) });
  }
  createObservation(data: Record<string, any>): Observable<{ id: number; message: string }> { return this.http.post<any>(`${this.API}/observations`, data); }
  updateObservation(id: number, data: Record<string, any>): Observable<{ message: string }> { return this.http.put<any>(`${this.API}/observations/${id}`, data); }

  // Training
  getTrainings(params: Record<string, any> = {}): Observable<{ trainings: Training[]; total: number; page: number }> {
    return this.http.get<any>(`${this.API}/trainings`, { params: this.toParams(params) });
  }
  createTraining(data: Record<string, any>): Observable<{ id: number; training_no: string; message: string }> { return this.http.post<any>(`${this.API}/trainings`, data); }
  updateTraining(id: number, data: Record<string, any>): Observable<{ message: string }> { return this.http.put<any>(`${this.API}/trainings/${id}`, data); }

  // PPE
  getPpe(params: Record<string, any> = {}): Observable<{ records: PpeRecord[]; total: number; page: number; summary: any[] }> {
    return this.http.get<any>(`${this.API}/ppe`, { params: this.toParams(params) });
  }
  createPpe(data: Record<string, any>): Observable<{ id: number; message: string }> { return this.http.post<any>(`${this.API}/ppe`, data); }
  updatePpe(id: number, data: Record<string, any>): Observable<{ message: string }> { return this.http.put<any>(`${this.API}/ppe/${id}`, data); }

  // Audits
  getAudits(params: Record<string, any> = {}): Observable<{ audits: SafetyAudit[]; total: number; page: number }> {
    return this.http.get<any>(`${this.API}/audits`, { params: this.toParams(params) });
  }
  createAudit(data: Record<string, any>): Observable<{ id: number; audit_no: string; message: string }> { return this.http.post<any>(`${this.API}/audits`, data); }
  updateAudit(id: number, data: Record<string, any>): Observable<{ message: string }> { return this.http.put<any>(`${this.API}/audits/${id}`, data); }

  // Reports
  getReport(type: string, params: { from?: string; to?: string } = {}): Observable<any> {
    let hp = new HttpParams().set('type', type);
    if (params.from) hp = hp.set('from', params.from);
    if (params.to) hp = hp.set('to', params.to);
    return this.http.get<any>(`${this.API}/reports`, { params: hp });
  }

  // Settings
  getSettings(): Observable<Record<string, string>> { return this.http.get<Record<string, string>>(`${this.API}/settings`); }
  saveSettings(data: Record<string, string>): Observable<{ success: boolean }> { return this.http.post<any>(`${this.API}/settings`, data); }

  private toParams(obj: Record<string, any>): HttpParams {
    let hp = new HttpParams();
    Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== '' && v !== null) hp = hp.set(k, String(v)); });
    return hp;
  }
}
