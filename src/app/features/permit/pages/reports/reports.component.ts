import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PermitService } from '../../services/permit.service';
import { Permit, PermitType, ReportResponse, PERMIT_STATUS_CONFIG, PERMIT_MODE_CONFIG } from '../../models/permit.models';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  loading = false;
  permitTypes: PermitType[] = [];
  results: ReportResponse | null = null;

  filters = {
    type: '',
    status: '',
    mode: '',
    department: '',
    from: '',
    to: '',
  };

  statusConfig = PERMIT_STATUS_CONFIG;
  modeConfig = PERMIT_MODE_CONFIG;
  statusKeys = Object.keys(PERMIT_STATUS_CONFIG);

  constructor(private permitService: PermitService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.permitService.getTypes().subscribe(t => { this.permitTypes = t; this.cdr.markForCheck(); });
  }

  search(): void {
    this.loading = true;
    const params: Record<string, string> = {};
    if (this.filters.type) params['type'] = this.filters.type;
    if (this.filters.status) params['status'] = this.filters.status;
    if (this.filters.mode) params['mode'] = this.filters.mode;
    if (this.filters.department) params['department'] = this.filters.department;
    if (this.filters.from) params['from'] = this.filters.from;
    if (this.filters.to) params['to'] = this.filters.to;

    this.permitService.getReport(params).subscribe({
      next: (r) => { this.results = r; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  reset(): void {
    this.filters = { type: '', status: '', mode: '', department: '', from: '', to: '' };
    this.results = null;
  }

  get summaryEntries(): { label: string; value: number; color: string }[] {
    if (!this.results?.summary?.byType) return [];
    return Object.entries(this.results.summary.byType).map(([k, v]) => {
      const t = this.permitTypes.find(pt => pt.value === k);
      return { label: t?.label || k, value: v, color: t?.color || '#64748b' };
    });
  }

  get statusEntries(): { label: string; value: number; color: string }[] {
    if (!this.results?.summary?.byStatus) return [];
    return Object.entries(this.results.summary.byStatus).map(([k, v]) => {
      const s = this.statusConfig[k];
      return { label: s?.label || k, value: v, color: s?.color || '#64748b' };
    });
  }

  get maxTypeCount(): number {
    return Math.max(1, ...this.summaryEntries.map(e => e.value));
  }

  exportCsv(): void {
    if (!this.results?.permits?.length) return;
    const headers = ['ID', 'Type', 'Location', 'Description', 'Mode', 'Status', 'Owner', 'Department', 'Start Date', 'Close Date'];
    const rows = this.results.permits.map(p => [
      p.id, p.typeLabel, p.location, `"${(p.description || '').replace(/"/g, '""')}"`,
      p.mode, p.status, p.permitOwner, p.department, p.expectedStart, p.closeDate || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permit-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportPdf(): void {
    if (!this.results?.permits?.length) return;
    const doc = new jsPDF({ orientation: 'landscape' });
    const today = new Date().toLocaleDateString();

    // Title
    doc.setFontSize(16);
    doc.text('Permit Portal - Report', 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${today} | Total: ${this.results.total} permits`, 14, 22);

    // Summary
    if (this.results.summary) {
      doc.setFontSize(10);
      doc.setTextColor(0);
      let y = 30;
      const byType = Object.entries(this.results.summary.byType).filter(([, v]) => v > 0);
      if (byType.length) {
        doc.text('By Type: ' + byType.map(([k, v]) => `${k}: ${v}`).join(', '), 14, y);
        y += 6;
      }
      const byMode = Object.entries(this.results.summary.byMode).filter(([, v]) => v > 0);
      if (byMode.length) {
        doc.text('By Mode: ' + byMode.map(([k, v]) => `${k}: ${v}`).join(', '), 14, y);
        y += 6;
      }
    }

    // Table
    autoTable(doc, {
      startY: 42,
      head: [['#', 'Type', 'Location', 'Description', 'Mode', 'Status', 'Owner', 'Department', 'Start Date', 'Close Date']],
      body: this.results.permits.map(p => [
        p.id, p.typeLabel, p.location,
        (p.description || '').substring(0, 50),
        p.mode, this.getStatusStyle(p.status).label,
        p.permitOwner, p.department,
        p.expectedStart, p.closeDate || '—',
      ]),
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246], fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`permit-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  exportExcel(): void {
    if (!this.results?.permits?.length) return;
    const data = this.results.permits.map(p => ({
      'ID': p.id,
      'Type': p.typeLabel,
      'Location': p.location,
      'Description': p.description,
      'Mode': p.mode,
      'Status': this.getStatusStyle(p.status).label,
      'Owner': p.permitOwner,
      'Department': p.department,
      'Start Date': p.expectedStart,
      'Close Date': p.closeDate || '',
      'Permit Number': p.permitNumber,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    // Auto-size columns
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(key.length, ...data.map(r => String((r as any)[key] || '').length).slice(0, 100)) + 2,
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Permits');

    // Summary sheet
    if (this.results.summary) {
      const summaryData = [
        { Category: 'REPORT SUMMARY', Key: '', Value: '' },
        { Category: 'Total Permits', Key: '', Value: this.results.total },
        { Category: '', Key: '', Value: '' },
        { Category: 'BY TYPE', Key: '', Value: '' },
        ...Object.entries(this.results.summary.byType).map(([k, v]) => ({ Category: '', Key: k, Value: v })),
        { Category: '', Key: '', Value: '' },
        { Category: 'BY STATUS', Key: '', Value: '' },
        ...Object.entries(this.results.summary.byStatus).map(([k, v]) => ({ Category: '', Key: this.getStatusStyle(k).label, Value: v })),
        { Category: '', Key: '', Value: '' },
        { Category: 'BY MODE', Key: '', Value: '' },
        ...Object.entries(this.results.summary.byMode).map(([k, v]) => ({ Category: '', Key: k, Value: v })),
      ];
      const ws2 = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
    }

    XLSX.writeFile(wb, `permit-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  getStatusStyle(status: string) { return this.statusConfig[status] || { label: status, color: '#64748b', bgColor: '#f1f5f9', icon: 'help' }; }
}
