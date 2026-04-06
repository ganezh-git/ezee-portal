import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LibraryService } from '../../services/library.service';

@Component({
  selector: 'app-library-reports',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1><span class="material-icons-round">assessment</span> Reports</h1>
      </div>

      <div class="report-selector">
        <div class="report-tabs">
          @for (r of reportTypes; track r.id) {
            <button [class.active]="selectedReport === r.id" (click)="selectedReport = r.id; generate()">
              <span class="material-icons-round">{{ r.icon }}</span>
              <span>{{ r.label }}</span>
            </button>
          }
        </div>
        <div class="date-range">
          <div class="form-group">
            <label>From</label>
            <input type="date" [(ngModel)]="fromDate" />
          </div>
          <div class="form-group">
            <label>To</label>
            <input type="date" [(ngModel)]="toDate" />
          </div>
          <button class="btn-primary" (click)="generate()"><span class="material-icons-round">play_arrow</span> Generate</button>
        </div>
      </div>

      @if (loading) {
        <div class="loading"><span class="material-icons-round spin">progress_activity</span> Generating report...</div>
      } @else if (data.length) {
        <div class="card">
          <div class="card-header">
            <h3>{{ getReportTitle() }} <small>({{ data.length }} records)</small></h3>
            <button class="btn-export" (click)="exportCsv()"><span class="material-icons-round">download</span> Export CSV</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr>@for (col of columns; track col) { <th>{{ col }}</th> }</tr></thead>
              <tbody>
                @for (row of data; track $index) {
                  <tr>@for (col of columns; track col) { <td [innerHTML]="formatCell(row, col)"></td> }</tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      } @else if (generated) {
        <div class="empty"><span class="material-icons-round">inbox</span><p>No data for the selected criteria</p></div>
      }
    </div>
  `,
  styleUrl: './library-reports.component.scss',
})
export class LibraryReportsComponent {
  reportTypes = [
    { id: 'overdue', label: 'Overdue Books', icon: 'warning' },
    { id: 'fines', label: 'Fine Collection', icon: 'receipt_long' },
    { id: 'popular', label: 'Popular Books', icon: 'trending_up' },
    { id: 'members', label: 'Member Activity', icon: 'people' },
    { id: 'circulation', label: 'Circulation Summary', icon: 'swap_horiz' },
  ];
  selectedReport = 'overdue';
  fromDate = ''; toDate = '';
  data: any[] = []; columns: string[] = [];
  loading = false; generated = false;

  constructor(private svc: LibraryService, private cdr: ChangeDetectorRef) {}

  generate(): void {
    this.loading = true; this.generated = false;
    this.svc.getReport(this.selectedReport, { from: this.fromDate, to: this.toDate }).subscribe({
      next: d => {
        this.data = d;
        this.columns = d.length ? Object.keys(d[0]) : [];
        this.loading = false; this.generated = true;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.generated = true; this.cdr.markForCheck(); },
    });
  }

  getReportTitle(): string {
    return this.reportTypes.find(r => r.id === this.selectedReport)?.label || '';
  }

  formatCell(row: any, col: string): string {
    const val = row[col];
    if (val === null || val === undefined) return '—';
    if (col.includes('date') || col.includes('_at')) {
      const d = new Date(val);
      return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (col.includes('amount') || col.includes('fine') || col.includes('price')) return `₹${val}`;
    return String(val);
  }

  exportCsv(): void {
    if (!this.data.length) return;
    const header = this.columns.join(',');
    const rows = this.data.map(r => this.columns.map(c => {
      const v = r[c];
      return typeof v === 'string' && v.includes(',') ? `"${v}"` : (v ?? '');
    }).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `library_${this.selectedReport}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }
}
