import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafetyService } from '../../services/safety.service';

@Component({
  selector: 'app-safety-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Safety Reports</h1>
        <button class="btn btn-outline" (click)="exportCsv()" *ngIf="reportData?.length"><span class="material-icons-round">download</span>Export CSV</button>
      </div>

      <!-- Report Selector -->
      <div class="report-selector">
        <div class="report-card" *ngFor="let rt of reportTypes" [class.active]="selectedReport === rt.key" (click)="selectReport(rt.key)">
          <span class="material-icons-round">{{ rt.icon }}</span>
          <span class="report-label">{{ rt.label }}</span>
        </div>
      </div>

      <!-- Date Filters -->
      <div class="filters">
        <div class="date-range">
          <label>From</label><input type="date" [(ngModel)]="dateFrom">
          <label>To</label><input type="date" [(ngModel)]="dateTo">
          <button class="btn btn-primary btn-sm" (click)="generate()"><span class="material-icons-round">assessment</span>Generate</button>
        </div>
        <div class="quick-ranges">
          <button *ngFor="let r of quickRanges" class="chip" [class.active]="activeRange === r.key" (click)="applyRange(r)">{{ r.label }}</button>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-bar" *ngIf="loading"><div class="loading-progress"></div></div>

      <!-- Report Content -->
      @if (reportData && !loading) {
        <div class="report-content">
          <!-- Summary Cards -->
          <div class="report-summary" *ngIf="summaryCards.length">
            <div class="summary-card" *ngFor="let c of summaryCards">
              <span class="summary-value">{{ c.value }}</span>
              <span class="summary-label">{{ c.label }}</span>
            </div>
          </div>

          <!-- Data Table -->
          @if (reportData.length) {
            <div class="table-wrap">
              <table>
                <thead><tr><th *ngFor="let col of columns">{{ col.label }}</th></tr></thead>
                <tbody>
                  @for (row of reportData; track $index) {
                    <tr><td *ngFor="let col of columns" [innerHTML]="getCellValue(row, col)"></td></tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="empty-report">
              <span class="material-icons-round">analytics</span>
              <p>No data for the selected period</p>
            </div>
          }
        </div>
      }

      @if (!reportData && !loading) {
        <div class="empty-report">
          <span class="material-icons-round">assessment</span>
          <h3>Select a Report Type</h3>
          <p>Choose a report and date range to generate safety analytics</p>
        </div>
      }
    </div>
  `,
  styleUrls: ['./safety-reports.component.scss']
})
export class SafetyReportsComponent implements OnInit {
  reportTypes = [
    { key: 'incident_summary', label: 'Incident Summary', icon: 'report_problem' },
    { key: 'audit_summary', label: 'Audit Summary', icon: 'verified' },
    { key: 'training_summary', label: 'Training Summary', icon: 'school' },
    { key: 'ppe_summary', label: 'PPE Summary', icon: 'masks' },
    { key: 'observation_summary', label: 'Observation Summary', icon: 'visibility' },
  ];
  quickRanges = [
    { key: '7d', label: 'Last 7 Days', days: 7 },
    { key: '30d', label: 'Last 30 Days', days: 30 },
    { key: '90d', label: 'Last 90 Days', days: 90 },
    { key: '1y', label: 'Last Year', days: 365 },
  ];

  selectedReport = '';
  dateFrom = ''; dateTo = '';
  activeRange = '';
  loading = false;
  reportData: any[] | null = null;
  summaryCards: { label: string; value: string | number }[] = [];
  columns: { key: string; label: string }[] = [];

  constructor(private svc: SafetyService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    const today = new Date();
    this.dateTo = today.toISOString().split('T')[0];
    const d30 = new Date(today); d30.setDate(d30.getDate() - 30);
    this.dateFrom = d30.toISOString().split('T')[0];
    this.activeRange = '30d';
  }

  selectReport(key: string) {
    this.selectedReport = key;
    this.generate();
  }

  applyRange(r: { key: string; days: number }) {
    this.activeRange = r.key;
    const today = new Date();
    this.dateTo = today.toISOString().split('T')[0];
    const from = new Date(today); from.setDate(from.getDate() - r.days);
    this.dateFrom = from.toISOString().split('T')[0];
    if (this.selectedReport) this.generate();
  }

  generate() {
    if (!this.selectedReport) return;
    this.loading = true;
    this.svc.getReport(this.selectedReport, { from: this.dateFrom, to: this.dateTo }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.reportData = res.data || [];
        this.buildColumns();
        this.buildSummary(res);
        this.cd.markForCheck();
      },
      error: () => { this.loading = false; this.reportData = []; this.cd.markForCheck(); }
    });
  }

  buildColumns() {
    const colMap: Record<string, { key: string; label: string }[]> = {
      incident_summary: [
        { key: 'incident_type', label: 'Type' }, { key: 'total', label: 'Total' },
        { key: 'critical', label: 'Critical' }, { key: 'high', label: 'High' },
        { key: 'medium', label: 'Medium' }, { key: 'low', label: 'Low' },
        { key: 'open', label: 'Open' }, { key: 'closed', label: 'Closed' }
      ],
      audit_summary: [
        { key: 'audit_type', label: 'Type' }, { key: 'total', label: 'Total' },
        { key: 'avg_score', label: 'Avg Score' }, { key: 'total_findings', label: 'Findings' },
        { key: 'critical_findings', label: 'Critical' }, { key: 'completed', label: 'Completed' }
      ],
      training_summary: [
        { key: 'training_type', label: 'Type' }, { key: 'sessions', label: 'Sessions' },
        { key: 'total_attendees', label: 'Attendees' }, { key: 'total_hours', label: 'Hours' },
        { key: 'completed', label: 'Completed' }, { key: 'upcoming', label: 'Upcoming' }
      ],
      ppe_summary: [
        { key: 'ppe_item', label: 'PPE Item' }, { key: 'total_issued', label: 'Issued' },
        { key: 'active', label: 'Active' }, { key: 'returned', label: 'Returned' },
        { key: 'expired', label: 'Expired' }
      ],
      observation_summary: [
        { key: 'department', label: 'Department' }, { key: 'total', label: 'Total' },
        { key: 'safe', label: 'Safe' }, { key: 'unsafe', label: 'Unsafe' },
        { key: 'compliance_rate', label: 'Compliance %' }
      ]
    };
    this.columns = colMap[this.selectedReport] || [];
    if (!this.columns.length && this.reportData?.length) {
      this.columns = Object.keys(this.reportData[0]).map(k => ({ key: k, label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }));
    }
  }

  buildSummary(res: any) {
    this.summaryCards = [];
    if (!this.reportData?.length) return;
    const data = this.reportData;
    switch (this.selectedReport) {
      case 'incident_summary':
        this.summaryCards = [
          { label: 'Total Incidents', value: data.reduce((s: number, r: any) => s + (r.total || 0), 0) },
          { label: 'Critical', value: data.reduce((s: number, r: any) => s + (r.critical || 0), 0) },
          { label: 'Open', value: data.reduce((s: number, r: any) => s + (r.open || 0), 0) },
          { label: 'Closed', value: data.reduce((s: number, r: any) => s + (r.closed || 0), 0) },
        ]; break;
      case 'audit_summary':
        this.summaryCards = [
          { label: 'Total Audits', value: data.reduce((s: number, r: any) => s + (r.total || 0), 0) },
          { label: 'Avg Score', value: (data.reduce((s: number, r: any) => s + (parseFloat(r.avg_score) || 0), 0) / data.length).toFixed(0) + '%' },
          { label: 'Total Findings', value: data.reduce((s: number, r: any) => s + (r.total_findings || 0), 0) },
        ]; break;
      case 'training_summary':
        this.summaryCards = [
          { label: 'Total Sessions', value: data.reduce((s: number, r: any) => s + (r.sessions || 0), 0) },
          { label: 'Total Attendees', value: data.reduce((s: number, r: any) => s + (r.total_attendees || 0), 0) },
          { label: 'Total Hours', value: data.reduce((s: number, r: any) => s + (r.total_hours || 0), 0) },
        ]; break;
      case 'ppe_summary':
        this.summaryCards = [
          { label: 'Total Issued', value: data.reduce((s: number, r: any) => s + (r.total_issued || 0), 0) },
          { label: 'Active', value: data.reduce((s: number, r: any) => s + (r.active || 0), 0) },
          { label: 'Expired', value: data.reduce((s: number, r: any) => s + (r.expired || 0), 0) },
        ]; break;
      case 'observation_summary':
        const tot = data.reduce((s: number, r: any) => s + (r.total || 0), 0);
        const safe = data.reduce((s: number, r: any) => s + (r.safe || 0), 0);
        this.summaryCards = [
          { label: 'Total Observations', value: tot },
          { label: 'Safe', value: safe },
          { label: 'Unsafe', value: tot - safe },
          { label: 'Compliance', value: tot ? (safe / tot * 100).toFixed(0) + '%' : '0%' },
        ]; break;
    }
  }

  getCellValue(row: any, col: { key: string; label: string }): string {
    const val = row[col.key];
    if (val == null) return '—';
    if (col.key.includes('score') || col.key.includes('rate')) return `<strong>${val}%</strong>`;
    if (col.key.includes('type') || col.key === 'department' || col.key === 'ppe_item') return String(val).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return String(val);
  }

  exportCsv() {
    if (!this.reportData?.length) return;
    const headers = this.columns.map(c => c.label).join(',');
    const rows = this.reportData.map(r => this.columns.map(c => `"${r[c.key] ?? ''}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${this.selectedReport}_${this.dateFrom}_${this.dateTo}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }
}
