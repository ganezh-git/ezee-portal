import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { VisitorService, DashboardStats, Visit } from '../../services/visitor.service';

@Component({
  selector: 'app-visitor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="header">
        <div class="page-header"><button class="back-btn" (click)="goBack()"><span class="material-icons-round">arrow_back</span></button>
        <h1><span class="material-icons-round">dashboard</span> Live Dashboard</h1></div>
        <button class="btn-refresh" (click)="load()"><span class="material-icons-round">refresh</span> Refresh</button>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid" *ngIf="stats">
        <div class="kpi blue"><div class="kpi-icon"><span class="material-icons-round">today</span></div><div class="kpi-body"><span class="kpi-val">{{ stats.todayExpected }}</span><span class="kpi-label">Expected Today</span></div></div>
        <div class="kpi green"><div class="kpi-icon"><span class="material-icons-round">person_pin</span></div><div class="kpi-body"><span class="kpi-val">{{ stats.currentlyInside }}</span><span class="kpi-label">Currently Inside</span></div></div>
        <div class="kpi amber"><div class="kpi-icon"><span class="material-icons-round">pending_actions</span></div><div class="kpi-body"><span class="kpi-val">{{ stats.pendingApprovals }}</span><span class="kpi-label">Pending Approval</span></div></div>
        <div class="kpi teal"><div class="kpi-icon"><span class="material-icons-round">login</span></div><div class="kpi-body"><span class="kpi-val">{{ stats.checkedInToday }}</span><span class="kpi-label">Checked In</span></div></div>
        <div class="kpi purple"><div class="kpi-icon"><span class="material-icons-round">logout</span></div><div class="kpi-body"><span class="kpi-val">{{ stats.checkedOutToday }}</span><span class="kpi-label">Checked Out</span></div></div>
        <div class="kpi red"><div class="kpi-icon"><span class="material-icons-round">person_off</span></div><div class="kpi-body"><span class="kpi-val">{{ stats.noShowToday }}</span><span class="kpi-label">No Show</span></div></div>
      </div>

      <!-- Overdue Alert -->
      <div class="section alert-section" *ngIf="stats && stats.overdue.length">
        <h3><span class="material-icons-round text-red">warning</span> Overdue Visitors (past expected departure)</h3>
        <table class="data-table">
          <thead><tr><th>Visit #</th><th>Visitor</th><th>Company</th><th>Host</th><th>Department</th><th>Expected Out</th><th>Action</th></tr></thead>
          <tbody>
            <tr *ngFor="let v of stats.overdue">
              <td>{{ v.visit_no }}</td><td>{{ v.visitor_name }}</td><td>{{ v.visitor_company }}</td>
              <td>{{ v.host_name }}</td><td>{{ v.host_department }}</td><td>{{ v.expected_departure }}</td>
              <td><button class="btn-sm red" (click)="quickCheckout(v)">Check Out</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pending Approvals -->
      <div class="section" *ngIf="stats && stats.pendingList.length">
        <div class="section-header">
          <h3><span class="material-icons-round text-amber">fact_check</span> Pending Approvals</h3>
          <a routerLink="../approvals" class="link">View All →</a>
        </div>
        <table class="data-table">
          <thead><tr><th>Visit #</th><th>Visitor</th><th>Category</th><th>Purpose</th><th>Date</th><th>Host</th><th>Dept</th><th>Booked By</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let v of stats.pendingList">
              <td>{{ v.visit_no }}</td><td>{{ v.visitor_name }}</td><td><span class="badge">{{ v.visitor_type }}</span></td>
              <td>{{ v.purpose }}</td>
              <td>{{ v.visit_date | date:'dd MMM' }}{{ v.visit_date_to ? ' – ' + (v.visit_date_to | date:'dd MMM') : '' }}</td>
              <td>{{ v.host_name }}</td><td>{{ v.host_department }}</td>
              <td>{{ v.booked_by }} <small>({{ v.booked_by_role }})</small></td>
              <td>
                <button class="btn-sm green" (click)="quickApprove(v, 'approve')">Approve</button>
                <button class="btn-sm red" (click)="quickApprove(v, 'reject')">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Check-in Queue -->
      <div class="section" *ngIf="stats && stats.checkInQueue.length">
        <div class="section-header">
          <h3><span class="material-icons-round text-blue">how_to_reg</span> Check-in Queue (Today)</h3>
          <a routerLink="../entry" class="link">Go to Entry →</a>
        </div>
        <table class="data-table">
          <thead><tr><th>Visit #</th><th>Visitor</th><th>Company</th><th>Category</th><th>Expected</th><th>Host</th><th>Dept</th><th>Count</th></tr></thead>
          <tbody>
            <tr *ngFor="let v of stats.checkInQueue">
              <td>{{ v.visit_no }}</td><td>{{ v.visitor_name }}</td><td>{{ v.visitor_company }}</td>
              <td><span class="badge">{{ v.visitor_type }}</span></td>
              <td>{{ v.expected_arrival || '—' }}</td><td>{{ v.host_name }}</td><td>{{ v.host_department }}</td>
              <td>{{ v.visitor_count }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Currently Inside -->
      <div class="section" *ngIf="stats && stats.insideList.length">
        <div class="section-header">
          <h3><span class="material-icons-round text-green">meeting_room</span> Currently Inside</h3>
          <a routerLink="../exit" class="link">Go to Exit →</a>
        </div>
        <table class="data-table">
          <thead><tr><th>Badge</th><th>Visitor</th><th>Company</th><th>Host / Dept</th><th>Entry Time</th><th>Entry By</th><th>Expected Out</th><th>Exit Ack.</th><th>Action</th></tr></thead>
          <tbody>
            <tr *ngFor="let v of stats.insideList">
              <td><strong>{{ v.badge_no }}</strong></td><td>{{ v.visitor_name }}</td><td>{{ v.visitor_company }}</td>
              <td>{{ v.host_name }} / {{ v.host_department }}</td>
              <td>{{ v.entry_time | date:'HH:mm' }}</td>
              <td>{{ v.entry_by }}</td>
              <td>{{ v.expected_departure || '—' }}</td>
              <td>{{ v.exit_acknowledged_by ? '✓ ' + v.exit_acknowledged_by : '—' }}</td>
              <td><button class="btn-sm purple" (click)="quickCheckout(v)">Check Out</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="!stats" class="loading">Loading dashboard...</div>
    </div>
  `,
  styles: [`
    .page { padding: 24px 28px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
      h1 { font-size: 1.4rem; font-weight: 700; display: flex; align-items: center; gap: 10px; margin: 0;
        .material-icons-round { color: #8b5cf6; }
      }
    }
    .btn-refresh { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; cursor: pointer; font-size: .85rem; &:hover { background: #f1f5f9; } }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 16px; margin-bottom: 28px; }
    .kpi { display: flex; align-items: center; gap: 14px; padding: 18px 16px; background: #fff; border-radius: 14px; box-shadow: 0 1px 4px rgba(0,0,0,.06);
      .kpi-icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
        .material-icons-round { font-size: 24px; color: #fff; }
      }
      .kpi-body { display: flex; flex-direction: column; }
      .kpi-val { font-size: 1.5rem; font-weight: 700; line-height: 1; }
      .kpi-label { font-size: .75rem; color: #64748b; margin-top: 2px; }
      &.blue .kpi-icon { background: #3b82f6; } &.blue .kpi-val { color: #3b82f6; }
      &.green .kpi-icon { background: #22c55e; } &.green .kpi-val { color: #22c55e; }
      &.amber .kpi-icon { background: #f59e0b; } &.amber .kpi-val { color: #f59e0b; }
      &.teal .kpi-icon { background: #14b8a6; } &.teal .kpi-val { color: #14b8a6; }
      &.purple .kpi-icon { background: #8b5cf6; } &.purple .kpi-val { color: #8b5cf6; }
      &.red .kpi-icon { background: #ef4444; } &.red .kpi-val { color: #ef4444; }
    }
    .section { background: #fff; border-radius: 14px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
    .alert-section { border-left: 4px solid #ef4444; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .section h3 { font-size: .95rem; font-weight: 600; display: flex; align-items: center; gap: 8px; margin: 0 0 12px; }
    .section-header h3 { margin-bottom: 0; }
    .link { color: #8b5cf6; font-size: .82rem; text-decoration: none; font-weight: 500; &:hover { text-decoration: underline; } }
    .text-red { color: #ef4444; } .text-amber { color: #f59e0b; } .text-blue { color: #3b82f6; } .text-green { color: #22c55e; }
    .data-table { width: 100%; border-collapse: collapse; font-size: .82rem;
      th { text-align: left; padding: 8px 10px; color: #64748b; font-weight: 600; border-bottom: 2px solid #f1f5f9; font-size: .75rem; text-transform: uppercase; }
      td { padding: 10px 10px; border-bottom: 1px solid #f1f5f9; }
      tr:hover td { background: #f8fafc; }
    }
    .badge { padding: 3px 10px; border-radius: 20px; font-size: .72rem; font-weight: 600; background: #ede9fe; color: #7c3aed; }
    .btn-sm { padding: 4px 12px; border: none; border-radius: 6px; font-size: .75rem; font-weight: 600; cursor: pointer; color: #fff; margin-right: 4px;
      &.green { background: #22c55e; &:hover { background: #16a34a; } }
      &.red { background: #ef4444; &:hover { background: #dc2626; } }
      &.purple { background: #8b5cf6; &:hover { background: #7c3aed; } }
    }
    .loading { text-align: center; padding: 60px; color: #94a3b8; }
    .page-header { display: flex; align-items: center; gap: 10px; }
    .back-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover { background: #f1f5f9; } .material-icons-round { font-size: 20px; color: #64748b; } }
  `]
})
export class VisitorDashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats | null = null;
  private interval: any;

  constructor(private svc: VisitorService, private router: Router) {}

  ngOnInit() { this.load(); this.interval = setInterval(() => this.load(), 30000); }
  ngOnDestroy() { clearInterval(this.interval); }

  load() {
    this.svc.getStats().subscribe(s => this.stats = s);
  }

  goBack() { this.router.navigate(['/portal']); }

  quickApprove(v: Visit, action: string) {
    if (action === 'reject' && !confirm('Reject this visit?')) return;
    this.svc.approve(v.id, action).subscribe(() => this.load());
  }

  quickCheckout(v: Visit) {
    if (!confirm(`Check out ${v.visitor_name}?`)) return;
    this.svc.checkout(v.id).subscribe(() => this.load());
  }
}
