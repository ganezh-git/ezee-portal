import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VisitorService, Visit, Gate } from '../../services/visitor.service';

@Component({
  selector: 'app-visitor-exit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <button class="back-btn" (click)="goBack()"><span class="material-icons-round">arrow_back</span></button>
        <h1><span class="material-icons-round">logout</span> Visitor Exit</h1>
      </div>

      <div class="tabs">
        <button [class.active]="tab==='inside'" (click)="tab='inside'">Currently Inside ({{ inside.length }})</button>
        <button [class.active]="tab==='myvisitors'" (click)="tab='myvisitors'; loadMyVisitors()">My Dept Visitors</button>
      </div>

      <!-- ─── CURRENTLY INSIDE ─── -->
      <div *ngIf="tab==='inside'">
        <div *ngIf="!inside.length" class="empty">No visitors currently inside</div>
        <table class="data-table" *ngIf="inside.length">
          <thead><tr><th>Badge</th><th>Visitor</th><th>Company</th><th>Category</th><th>Host / Dept</th><th>Entry Time</th><th>Entry By</th><th>Expected Out</th><th>Exit Ack.</th><th>Remarks</th><th>Action</th></tr></thead>
          <tbody>
            <tr *ngFor="let v of inside">
              <td><strong>{{ v.badge_no }}</strong></td>
              <td>
                <span class="link" (click)="viewDetail(v)">{{ v.visitor_name }}</span>
              </td>
              <td>{{ v.visitor_company }}</td>
              <td><span class="badge">{{ v.visitor_type }}</span></td>
              <td>{{ v.host_name }} / {{ v.host_department }}</td>
              <td>{{ v.entry_time | date:'HH:mm' }}</td>
              <td>{{ v.entry_by }}</td>
              <td>{{ v.expected_departure || '—' }}</td>
              <td>
                <span *ngIf="v.exit_acknowledged_by" class="ack-yes">✓ {{ v.exit_acknowledged_by }}<br><small>{{ v.tentative_exit_time | date:'HH:mm' }}</small></span>
                <span *ngIf="!v.exit_acknowledged_by" class="ack-no">Pending</span>
              </td>
              <td>
                <input [(ngModel)]="exitRemarks[v.id]" placeholder="Exit remarks..." class="remarks-input">
              </td>
              <td class="action-cell">
                <select [(ngModel)]="exitGate[v.id]" class="gate-select">
                  <option value="">Gate</option>
                  <option *ngFor="let g of gates" [value]="g.name">{{ g.name }}</option>
                </select>
                <button class="btn-sm purple" (click)="doCheckout(v)" [disabled]="checkingOut[v.id]">
                  {{ checkingOut[v.id] ? '...' : 'Check Out' }}
                </button>
                <button class="btn-sm dark" (click)="openBlockModal(v)" title="Block"><span class="material-icons-round">block</span></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ─── MY DEPARTMENT VISITORS ─── -->
      <div *ngIf="tab==='myvisitors'">
        <div *ngIf="!myVisitors.length" class="empty">No visitors for your department</div>
        <table class="data-table" *ngIf="myVisitors.length">
          <thead><tr><th>Visit #</th><th>Visitor</th><th>Company</th><th>Category</th><th>Status</th><th>Entry Time</th><th>Waiting Since</th><th>Action</th></tr></thead>
          <tbody>
            <tr *ngFor="let v of myVisitors">
              <td>{{ v.visit_no }}</td>
              <td><span class="link" (click)="viewDetail(v)">{{ v.visitor_name }}</span></td>
              <td>{{ v.visitor_company }}</td>
              <td><span class="badge">{{ v.visitor_type }}</span></td>
              <td><span class="status-chip" [attr.data-status]="v.status">{{ formatStatus(v.status) }}</span></td>
              <td>{{ v.entry_time ? (v.entry_time | date:'HH:mm') : '—' }}</td>
              <td>{{ v.status === 'checked_in' ? getWaitTime(v.entry_time) : '—' }}</td>
              <td class="action-cell">
                <button *ngIf="v.status==='checked_in' && !v.exit_acknowledged_by" class="btn-sm green" (click)="acknowledgeExit(v)">
                  Acknowledge Exit
                </button>
                <span *ngIf="v.exit_acknowledged_by" class="ack-done">✓ Acknowledged</span>
                <button *ngIf="['scheduled','approved','pending_approval'].includes(v.status)" class="btn-sm red" (click)="openCancelModal(v)" title="Cancel">
                  <span class="material-icons-round">cancel</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ─── VISITOR DETAIL PANEL ─── -->
      <div class="detail-panel" *ngIf="detailVisit">
        <div class="detail-header">
          <h3><span class="material-icons-round">person</span> {{ detailVisit.visitor_name }} — {{ detailVisit.visit_no }}</h3>
          <button class="btn-close" (click)="detailVisit=null">Close</button>
        </div>
        <div class="detail-grid">
          <div><label>Category</label><span>{{ detailVisit.visitor_type }}</span></div>
          <div><label>Company</label><span>{{ detailVisit.visitor_company || '—' }}</span></div>
          <div><label>Phone</label><span>{{ detailVisit.visitor_phone || '—' }}</span></div>
          <div><label>Purpose</label><span>{{ detailVisit.purpose }}</span></div>
          <div><label>Host</label><span>{{ detailVisit.host_name }} / {{ detailVisit.host_department }}</span></div>
          <div><label>Visit Date</label><span>{{ detailVisit.visit_date | date:'dd-MMM-yyyy' }}</span></div>
          <div><label>Status</label><span class="status-chip" [attr.data-status]="detailVisit.status">{{ formatStatus(detailVisit.status) }}</span></div>
          <div *ngIf="detailVisit.badge_no"><label>Badge</label><span>{{ detailVisit.badge_no }}</span></div>
          <div *ngIf="detailVisit.entry_time"><label>Entry</label><span>{{ detailVisit.entry_time | date:'dd-MMM HH:mm' }} by {{ detailVisit.entry_by }}</span></div>
          <div *ngIf="detailVisit.exit_time"><label>Exit</label><span>{{ detailVisit.exit_time | date:'dd-MMM HH:mm' }} by {{ detailVisit.exit_by }}</span></div>
          <div *ngIf="detailVisit.vehicle_no"><label>Vehicle</label><span>{{ detailVisit.vehicle_no }}</span></div>
          <div *ngIf="detailVisit.remarks"><label>Remarks</label><span>{{ detailVisit.remarks }}</span></div>
        </div>
      </div>

      <!-- ─── ACTION MODAL ─── -->
      <div class="modal-overlay" *ngIf="modal.open" (click)="modal.open=false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h3><span class="material-icons-round" [style.color]="modal.color">{{ modal.icon }}</span> {{ modal.title }}</h3>
          <p class="modal-sub">{{ modal.visitorName }}</p>
          <div class="field">
            <label>Reason *</label>
            <textarea [(ngModel)]="modal.reason" rows="3" placeholder="Enter reason..."></textarea>
          </div>
          <div *ngIf="modal.type==='block'" class="field">
            <label>Severity</label>
            <select [(ngModel)]="modal.severity">
              <option value="low">Low</option><option value="medium">Medium</option>
              <option value="high">High</option><option value="critical">Critical</option>
            </select>
          </div>
          <div *ngIf="modal.error" class="alert error">{{ modal.error }}</div>
          <div class="modal-actions">
            <button class="btn-close" (click)="modal.open=false">Cancel</button>
            <button class="btn-confirm" [style.background]="modal.color" (click)="confirmModal()" [disabled]="modal.saving">
              {{ modal.saving ? 'Processing...' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px 28px; }
    .page-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
      h1 { font-size: 1.4rem; font-weight: 700; display: flex; align-items: center; gap: 10px; margin: 0;
        .material-icons-round { color: #8b5cf6; }
      }
    }
    .back-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
      &:hover { background: #f1f5f9; }
      .material-icons-round { font-size: 20px; color: #64748b; }
    }
    .tabs { display: flex; gap: 4px; margin-bottom: 20px;
      button { padding: 9px 20px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer; font-size: .85rem; font-weight: 500;
        &.active { background: #8b5cf6; color: #fff; border-color: #8b5cf6; }
        &:hover:not(.active) { background: #f8fafc; }
      }
    }
    .data-table { width: 100%; border-collapse: collapse; font-size: .82rem; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.06);
      th { text-align: left; padding: 10px 12px; color: #64748b; font-weight: 600; border-bottom: 2px solid #f1f5f9; font-size: .72rem; text-transform: uppercase; }
      td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
      tr:hover td { background: #f8fafc; }
    }
    .badge { padding: 3px 10px; border-radius: 20px; font-size: .72rem; font-weight: 600; background: #ede9fe; color: #7c3aed; }
    .status-chip { padding: 3px 10px; border-radius: 20px; font-size: .72rem; font-weight: 600;
      &[data-status="checked_in"] { background: #dcfce7; color: #166534; }
      &[data-status="approved"] { background: #dbeafe; color: #1e40af; }
      &[data-status="pending_approval"] { background: #fef3c7; color: #92400e; }
      &[data-status="checked_out"] { background: #f1f5f9; color: #64748b; }
    }
    .link { color: #8b5cf6; cursor: pointer; font-weight: 600; &:hover { text-decoration: underline; } }
    .ack-yes { color: #22c55e; font-size: .8rem; font-weight: 600; small { color: #64748b; } }
    .ack-no { color: #f59e0b; font-size: .8rem; }
    .ack-done { color: #22c55e; font-size: .78rem; font-weight: 600; }
    .remarks-input { padding: 5px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: .78rem; width: 120px; }
    .gate-select { padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: .78rem; }
    .action-cell { white-space: nowrap; display: flex; gap: 4px; align-items: center; }
    .btn-sm { padding: 5px 12px; border: none; border-radius: 6px; font-size: .75rem; font-weight: 600; cursor: pointer; color: #fff; display: inline-flex; align-items: center; gap: 4px;
      &.purple { background: #8b5cf6; &:hover { background: #7c3aed; } }
      &.green { background: #22c55e; &:hover { background: #16a34a; } }
      &.red { background: #ef4444; &:hover { background: #dc2626; } }
      &.dark { background: #475569; &:hover { background: #334155; }
        .material-icons-round { font-size: 16px; }
      }
      &:disabled { opacity: .5; }
    }
    .empty { text-align: center; padding: 40px; color: #94a3b8; background: #fff; border-radius: 14px; }
    /* Detail Panel */
    .detail-panel { background: #fff; border-radius: 14px; padding: 20px 24px; margin-top: 18px; box-shadow: 0 2px 8px rgba(0,0,0,.08); border: 1px solid #e2e8f0; }
    .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;
      h3 { font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; margin: 0; .material-icons-round { color: #8b5cf6; } }
    }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px 18px;
      > div { display: flex; flex-direction: column; gap: 2px;
        label { font-size: .72rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
        span { font-size: .86rem; color: #1e293b; }
      }
    }
    .btn-close { padding: 6px 14px; border: 1px solid #e2e8f0; background: #fff; border-radius: 6px; cursor: pointer; font-size: .82rem; &:hover { background: #f1f5f9; } }
    /* Modal */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal-card { background: #fff; border-radius: 16px; padding: 24px 28px; width: 440px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,.2);
      h3 { font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 10px; margin: 0 0 6px; }
      .modal-sub { font-size: .85rem; color: #64748b; margin: 0 0 16px; }
      .field { margin-bottom: 12px;
        label { display: block; font-size: .78rem; font-weight: 600; color: #475569; margin-bottom: 4px; }
        textarea, select { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .85rem; }
      }
    }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
    .btn-confirm { padding: 8px 20px; color: #fff; border: none; border-radius: 8px; font-size: .88rem; font-weight: 600; cursor: pointer; &:disabled { opacity: .5; } }
    .alert.error { padding: 8px 12px; border-radius: 6px; font-size: .82rem; background: #fef2f2; color: #991b1b; margin-top: 8px; }
  `]
})
export class VisitorExitComponent implements OnInit {
  tab = 'inside';
  inside: Visit[] = [];
  myVisitors: Visit[] = [];
  gates: Gate[] = [];
  exitGate: Record<number, string> = {};
  exitRemarks: Record<number, string> = {};
  checkingOut: Record<number, boolean> = {};
  detailVisit: Visit | null = null;

  modal = { open: false, type: '', title: '', icon: '', color: '', visitId: 0, visitorName: '', reason: '', severity: 'high', saving: false, error: '' };

  constructor(private svc: VisitorService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.svc.getCurrentlyInside().subscribe(v => { this.inside = v; this.cdr.markForCheck(); });
    this.svc.getGates().subscribe(g => { this.gates = g; this.cdr.markForCheck(); });
  }

  goBack() { this.router.navigate(['/visitor/dashboard']); }

  loadMyVisitors() {
    this.svc.getMyVisitors().subscribe(v => { this.myVisitors = v; this.cdr.markForCheck(); });
  }

  doCheckout(v: Visit) {
    if (!confirm(`Check out ${v.visitor_name}?`)) return;
    this.checkingOut[v.id] = true;
    this.svc.checkout(v.id, this.exitGate[v.id], this.exitRemarks[v.id]).subscribe({
      next: () => {
        this.checkingOut[v.id] = false;
        this.svc.getCurrentlyInside().subscribe(list => { this.inside = list; this.cdr.markForCheck(); });
      },
      error: () => { this.checkingOut[v.id] = false; this.cdr.markForCheck(); }
    });
  }

  acknowledgeExit(v: Visit) {
    this.svc.acknowledgeExit(v.id).subscribe(() => { this.loadMyVisitors(); this.cdr.markForCheck(); });
  }

  viewDetail(v: Visit) {
    this.svc.getVisit(v.id).subscribe(full => { this.detailVisit = full; this.cdr.markForCheck(); });
  }

  openBlockModal(v: Visit) {
    this.modal = { open: true, type: 'block', title: 'Block Visitor', icon: 'block', color: '#475569', visitId: v.id, visitorName: v.visitor_name, reason: '', severity: 'high', saving: false, error: '' };
  }

  openCancelModal(v: Visit) {
    this.modal = { open: true, type: 'cancel', title: 'Cancel Visit', icon: 'cancel', color: '#ef4444', visitId: v.id, visitorName: v.visitor_name, reason: '', severity: 'high', saving: false, error: '' };
  }

  confirmModal() {
    if (!this.modal.reason) { this.modal.error = 'Reason is required'; return; }
    this.modal.saving = true;
    this.modal.error = '';

    const done = () => {
      this.modal.saving = false;
      this.modal.open = false;
      this.svc.getCurrentlyInside().subscribe(v => { this.inside = v; this.cdr.markForCheck(); });
      this.loadMyVisitors();
      this.cdr.markForCheck();
    };
    const fail = (e: any) => { this.modal.saving = false; this.modal.error = e.error?.error || 'Action failed'; this.cdr.markForCheck(); };

    if (this.modal.type === 'block') {
      this.svc.block(this.modal.visitId, this.modal.reason, this.modal.severity).subscribe({ next: done, error: fail });
    } else if (this.modal.type === 'cancel') {
      this.svc.cancel(this.modal.visitId, this.modal.reason).subscribe({ next: done, error: fail });
    }
  }

  formatStatus(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

  getWaitTime(entryTime: string): string {
    if (!entryTime) return '—';
    const diff = Date.now() - new Date(entryTime).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }
}
