import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VisitorService, Visit } from '../../services/visitor.service';

@Component({
  selector: 'app-all-visits',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <div class="page-header"><button class="back-btn" (click)="goBack()"><span class="material-icons-round">arrow_back</span></button>
        <h1><span class="material-icons-round">list_alt</span> All Visits</h1></div>
      </div>

      <div class="filters">
        <input placeholder="Search name, company, visit #..." [(ngModel)]="search" (keyup.enter)="load()">
        <select [(ngModel)]="statusFilter" (change)="load()">
          <option value="">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="checked_in">Checked In</option>
          <option value="checked_out">Checked Out</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
        <select [(ngModel)]="typeFilter" (change)="load()">
          <option value="">All Categories</option>
          <option *ngFor="let t of visitorTypes" [value]="t">{{ t }}</option>
        </select>
        <input type="date" [(ngModel)]="dateFrom" (change)="load()">
        <span>to</span>
        <input type="date" [(ngModel)]="dateTo" (change)="load()">
        <button class="btn-search" (click)="load()"><span class="material-icons-round">search</span></button>
      </div>

      <div class="count">Showing {{ visits.length }} visits</div>

      <table class="data-table" *ngIf="visits.length">
        <thead><tr>
          <th>Visit #</th><th>Visitor</th><th>Company</th><th>Category</th><th>Purpose</th>
          <th>Date</th><th>Host / Dept</th><th>Entry</th><th>Entry By</th><th>Exit</th><th>Exit By</th><th>Badge</th><th>Status</th>
        </tr></thead>
        <tbody>
          <tr *ngFor="let v of visits" (click)="selectVisit(v)" class="clickable">
            <td>{{ v.visit_no }}</td>
            <td>{{ v.visitor_name }}</td>
            <td>{{ v.visitor_company || '—' }}</td>
            <td><span class="badge">{{ v.visitor_type }}</span></td>
            <td class="truncate">{{ v.purpose }}</td>
            <td>{{ v.visit_date | date:'dd MMM' }}{{ v.visit_date_to ? ' – ' + (v.visit_date_to | date:'dd MMM') : '' }}</td>
            <td>{{ v.host_name }} / {{ v.host_department }}</td>
            <td>{{ v.entry_time ? (v.entry_time | date:'HH:mm') : '—' }}</td>
            <td>{{ v.entry_by || '—'}}</td>
            <td>{{ v.exit_time ? (v.exit_time | date:'HH:mm') : '—' }}</td>
            <td>{{ v.exit_by || '—' }}</td>
            <td>{{ v.badge_no || '—' }}</td>
            <td><span class="status-chip" [attr.data-status]="v.status">{{ formatStatus(v.status) }}</span></td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="!visits.length" class="empty">No visits found</div>

      <!-- Detail Panel -->
      <div class="detail-overlay" *ngIf="selected" (click)="selected=null">
        <div class="detail-panel" (click)="$event.stopPropagation()">
          <div class="detail-header">
            <h3>{{ selected.visit_no }} — {{ selected.visitor_name }}</h3>
            <button (click)="selected=null"><span class="material-icons-round">close</span></button>
          </div>
          <div class="detail-body">
            <div class="d-grid">
              <div><label>Category</label><span>{{ selected.visitor_type }}</span></div>
              <div><label>Company</label><span>{{ selected.visitor_company || '—' }}</span></div>
              <div><label>Phone</label><span>{{ selected.visitor_phone || '—' }}</span></div>
              <div><label>Email</label><span>{{ selected.visitor_email || '—' }}</span></div>
              <div><label>Purpose</label><span>{{ selected.purpose }}</span></div>
              <div><label>Date</label><span>{{ selected.visit_date | date:'dd MMM yyyy' }}{{ selected.visit_date_to ? ' – ' + (selected.visit_date_to | date:'dd MMM yyyy') : '' }}</span></div>
              <div><label>Expected</label><span>{{ selected.expected_arrival || '—' }} – {{ selected.expected_departure || '—' }}</span></div>
              <div><label>Host</label><span>{{ selected.host_name }} ({{ selected.host_department }})</span></div>
              <div><label>Booked By</label><span>{{ selected.booked_by }} ({{ selected.booked_by_role }})</span></div>
              <div><label>Approval</label><span>{{ selected.approval_status }} {{ selected.bypass_approval ? '(bypassed)' : '' }}</span></div>
              <div><label>Entry</label><span>{{ selected.entry_time ? (selected.entry_time | date:'dd MMM HH:mm') : '—' }} by {{ selected.entry_by || '—' }} at {{ selected.entry_gate || '—' }}</span></div>
              <div><label>Exit</label><span>{{ selected.exit_time ? (selected.exit_time | date:'dd MMM HH:mm') : '—' }} by {{ selected.exit_by || '—' }} at {{ selected.exit_gate || '—' }}</span></div>
              <div><label>Badge / Pass</label><span>{{ selected.badge_no || '—' }} / {{ selected.pass_no || '—' }}</span></div>
              <div><label>Status</label><span class="status-chip" [attr.data-status]="selected.status">{{ formatStatus(selected.status) }}</span></div>
            </div>

            <div *ngIf="selected.logs?.length" class="log-section">
              <h4>Activity Log</h4>
              <div class="log-entry" *ngFor="let l of selected.logs">
                <span class="log-action">{{ l.action }}</span>
                <span class="log-detail">{{ l.details }}</span>
                <span class="log-meta">{{ l.performed_by }} · {{ l.performed_at | date:'dd MMM HH:mm' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px 28px; }
    .header { margin-bottom: 16px;
      h1 { font-size: 1.4rem; font-weight: 700; display: flex; align-items: center; gap: 10px; margin: 0;
        .material-icons-round { color: #8b5cf6; }
      }
    }
    .page-header { display: flex; align-items: center; gap: 10px; }
    .back-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover { background: #f1f5f9; } .material-icons-round { font-size: 20px; color: #64748b; } }
    .filters { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; align-items: center;
      input, select { padding: 7px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .82rem; }
      input:first-child { min-width: 240px; }
      span { color: #64748b; font-size: .82rem; }
    }
    .btn-search { padding: 7px 12px; background: #8b5cf6; color: #fff; border: none; border-radius: 8px; cursor: pointer; display: flex;
      .material-icons-round { font-size: 18px; }
    }
    .count { font-size: .78rem; color: #64748b; margin-bottom: 10px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: .8rem; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.06);
      th { text-align: left; padding: 8px 10px; color: #64748b; font-weight: 600; border-bottom: 2px solid #f1f5f9; font-size: .7rem; text-transform: uppercase; }
      td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
      tr.clickable { cursor: pointer; &:hover td { background: #f0f0ff; } }
    }
    .truncate { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .badge { padding: 3px 10px; border-radius: 20px; font-size: .7rem; font-weight: 600; background: #ede9fe; color: #7c3aed; }
    .status-chip { padding: 3px 10px; border-radius: 20px; font-size: .7rem; font-weight: 600; white-space: nowrap;
      &[data-status="checked_in"] { background: #dcfce7; color: #166534; }
      &[data-status="checked_out"] { background: #f1f5f9; color: #64748b; }
      &[data-status="approved"] { background: #dbeafe; color: #1e40af; }
      &[data-status="pending_approval"] { background: #fef3c7; color: #92400e; }
      &[data-status="rejected"] { background: #fef2f2; color: #991b1b; }
      &[data-status="cancelled"] { background: #fef2f2; color: #991b1b; }
      &[data-status="no_show"] { background: #fef2f2; color: #991b1b; }
      &[data-status="scheduled"] { background: #e0f2fe; color: #0369a1; }
    }
    .empty { text-align: center; padding: 40px; color: #94a3b8; background: #fff; border-radius: 14px; }

    .detail-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; justify-content: flex-end; }
    .detail-panel { width: 520px; background: #fff; height: 100%; overflow-y: auto; box-shadow: -4px 0 20px rgba(0,0,0,.1); }
    .detail-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid #f1f5f9;
      h3 { font-size: 1rem; font-weight: 700; margin: 0; }
      button { background: none; border: none; cursor: pointer; color: #64748b; }
    }
    .detail-body { padding: 20px 24px; }
    .d-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
      div { display: flex; flex-direction: column; }
      label { font-size: .7rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
      span { font-size: .85rem; color: #1e293b; }
    }
    .log-section { margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;
      h4 { font-size: .85rem; font-weight: 600; margin: 0 0 12px; }
    }
    .log-entry { padding: 8px 0; border-bottom: 1px solid #f8fafc; display: flex; flex-direction: column; gap: 2px;
      .log-action { font-size: .78rem; font-weight: 600; color: #8b5cf6; }
      .log-detail { font-size: .82rem; color: #334155; }
      .log-meta { font-size: .72rem; color: #94a3b8; }
    }
  `]
})
export class AllVisitsComponent implements OnInit {
  visits: Visit[] = [];
  visitorTypes: string[] = [];
  selected: Visit | null = null;
  search = ''; statusFilter = ''; typeFilter = '';
  dateFrom = ''; dateTo = '';

  constructor(private svc: VisitorService, private router: Router) {}

  ngOnInit() {
    this.svc.getSettings().subscribe(s => {
      this.visitorTypes = (s['visitor_types'] || '').split(',').map(t => t.trim()).filter(Boolean);
    });
    this.load();
  }

  goBack() { this.router.navigate(['/visitor/dashboard']); }

  load() {
    const params: Record<string, string> = {};
    if (this.search) params['search'] = this.search;
    if (this.statusFilter) params['status'] = this.statusFilter;
    if (this.typeFilter) params['type'] = this.typeFilter;
    if (this.dateFrom) params['from'] = this.dateFrom;
    if (this.dateTo) params['to'] = this.dateTo;
    this.svc.getVisits(params).subscribe(v => this.visits = v);
  }

  selectVisit(v: Visit) {
    this.svc.getVisit(v.id).subscribe(full => this.selected = full);
  }

  formatStatus(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
}
