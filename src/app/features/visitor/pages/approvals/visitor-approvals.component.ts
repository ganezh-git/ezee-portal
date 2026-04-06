import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VisitorService, Visit } from '../../services/visitor.service';

@Component({
  selector: 'app-visitor-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <div class="page-header"><button class="back-btn" (click)="goBack()"><span class="material-icons-round">arrow_back</span></button>
        <h1><span class="material-icons-round">fact_check</span> Approvals</h1></div>
        <div class="filter">
          <select [(ngModel)]="deptFilter" (change)="load()">
            <option value="">All Departments</option>
            <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
          </select>
        </div>
      </div>

      <div *ngIf="!visits.length" class="empty-state">
        <span class="material-icons-round">check_circle</span>
        <p>No pending approvals</p>
      </div>

      <div class="card" *ngFor="let v of visits">
        <div class="card-header">
          <div>
            <span class="visit-no">{{ v.visit_no }}</span>
            <span class="badge">{{ v.visitor_type }}</span>
          </div>
          <span class="date">{{ v.visit_date | date:'dd MMM yyyy' }}{{ v.visit_date_to ? ' – ' + (v.visit_date_to | date:'dd MMM') : '' }}</span>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div><label>Visitor</label><span>{{ v.visitor_name }}</span></div>
            <div><label>Company</label><span>{{ v.visitor_company || '—' }}</span></div>
            <div><label>Purpose</label><span>{{ v.purpose }}</span></div>
            <div><label>Expected</label><span>{{ v.expected_arrival || '—' }} – {{ v.expected_departure || '—' }}</span></div>
            <div><label>Host</label><span>{{ v.host_name }}</span></div>
            <div><label>Department</label><span>{{ v.host_department }}</span></div>
            <div><label>Headcount</label><span>{{ v.visitor_count }}</span></div>
            <div><label>Booked By</label><span>{{ v.booked_by }} ({{ v.booked_by_role }})</span></div>
          </div>
        </div>
        <div class="card-actions">
          <input class="remarks-input" [(ngModel)]="remarks[v.id]" placeholder="Remarks (optional)">
          <button class="btn green" (click)="doApprove(v, 'approve')"><span class="material-icons-round">check</span> Approve</button>
          <button class="btn red" (click)="doApprove(v, 'reject')"><span class="material-icons-round">close</span> Reject</button>
          <button class="btn amber" (click)="openModal('cancel', v)"><span class="material-icons-round">cancel</span> Cancel</button>
          <button class="btn dark" (click)="openModal('block', v)"><span class="material-icons-round">block</span> Block</button>
        </div>
      </div>

      <!-- Action Modal -->
      <div class="modal-overlay" *ngIf="actionModal.open" (click)="actionModal.open=false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h3><span class="material-icons-round" [style.color]="actionModal.color">{{ actionModal.icon }}</span> {{ actionModal.title }}</h3>
          <p class="modal-sub">{{ actionModal.visitorName }} — {{ actionModal.visitNo }}</p>
          <div class="field">
            <label>Reason *</label>
            <textarea [(ngModel)]="actionModal.reason" rows="3" placeholder="Enter reason..."></textarea>
          </div>
          <div *ngIf="actionModal.type==='block'" class="field">
            <label>Severity</label>
            <select [(ngModel)]="actionModal.severity">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div *ngIf="actionModal.error" class="alert error" style="margin-top:8px">{{ actionModal.error }}</div>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="actionModal.open=false">Cancel</button>
            <button class="btn-confirm" [style.background]="actionModal.color" (click)="confirmAction()" [disabled]="actionModal.saving">
              {{ actionModal.saving ? 'Processing...' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px 28px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
      h1 { font-size: 1.4rem; font-weight: 700; display: flex; align-items: center; gap: 10px; margin: 0;
        .material-icons-round { color: #8b5cf6; }
      }
    }
    .filter select { padding: 8px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .85rem; }
    .empty-state { text-align: center; padding: 60px; color: #94a3b8;
      .material-icons-round { font-size: 48px; margin-bottom: 8px; color: #22c55e; }
      p { font-size: 1rem; }
    }
    .card { background: #fff; border-radius: 14px; padding: 0; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06); overflow: hidden; }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: #faf5ff; border-bottom: 1px solid #f1f5f9;
      .visit-no { font-weight: 700; font-size: .9rem; margin-right: 10px; }
      .date { font-size: .82rem; color: #64748b; }
    }
    .badge { padding: 3px 10px; border-radius: 20px; font-size: .72rem; font-weight: 600; background: #ede9fe; color: #7c3aed; }
    .card-body { padding: 16px 20px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;
      div { display: flex; flex-direction: column; }
      label { font-size: .7rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
      span { font-size: .85rem; color: #1e293b; }
    }
    .card-actions { display: flex; gap: 10px; padding: 14px 20px; border-top: 1px solid #f1f5f9; align-items: center; }
    .remarks-input { flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .85rem;
      &:focus { outline: none; border-color: #8b5cf6; }
    }
    .btn { padding: 8px 18px; border: none; border-radius: 8px; font-size: .82rem; font-weight: 600; cursor: pointer; color: #fff; display: flex; align-items: center; gap: 6px;
      &.green { background: #22c55e; &:hover { background: #16a34a; } }
      &.red { background: #ef4444; &:hover { background: #dc2626; } }
      &.amber { background: #f59e0b; &:hover { background: #d97706; } }
      &.dark { background: #475569; &:hover { background: #334155; } }
    }
    .page-header { display: flex; align-items: center; gap: 10px; }
    .back-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover { background: #f1f5f9; } .material-icons-round { font-size: 20px; color: #64748b; } }
    /* Modal */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal-card { background: #fff; border-radius: 16px; padding: 24px 28px; width: 440px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,.2);
      h3 { font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 10px; margin: 0 0 6px; }
      .modal-sub { font-size: .85rem; color: #64748b; margin: 0 0 16px; }
      .field { margin-bottom: 12px;
        label { display: block; font-size: .78rem; font-weight: 600; color: #475569; margin-bottom: 4px; }
        textarea, select { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .85rem; &:focus { outline: none; border-color: #8b5cf6; } }
      }
    }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
    .btn-cancel { padding: 8px 20px; background: #f1f5f9; color: #334155; border: none; border-radius: 8px; font-size: .88rem; font-weight: 600; cursor: pointer; }
    .btn-confirm { padding: 8px 20px; color: #fff; border: none; border-radius: 8px; font-size: .88rem; font-weight: 600; cursor: pointer;
      &:disabled { opacity: .5; }
    }
    .alert.error { padding: 8px 12px; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; border-radius: 8px; font-size: .82rem; }
  `]
})
export class VisitorApprovalsComponent implements OnInit {
  visits: Visit[] = [];
  departments: string[] = [];
  deptFilter = '';
  remarks: Record<number, string> = {};
  actionModal = { open: false, type: '', title: '', icon: '', color: '', visitId: 0, visitorName: '', visitNo: '', reason: '', severity: 'high', saving: false, error: '' };

  constructor(private svc: VisitorService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.svc.getSettings().subscribe(s => {
      this.departments = (s['departments'] || '').split(',').map(d => d.trim()).filter(Boolean);
      this.cdr.markForCheck();
    });
    this.load();
  }

  load() {
    this.svc.getPendingApprovals(this.deptFilter || undefined).subscribe(v => { this.visits = v; this.cdr.markForCheck(); });
  }

  doApprove(v: Visit, action: string) {
    if (action === 'reject') { this.openModal('reject', v); return; }
    this.svc.approve(v.id, action, this.remarks[v.id]).subscribe(() => { this.load(); this.cdr.markForCheck(); });
  }

  goBack() { this.router.navigate(['/visitor/dashboard']); }

  openModal(type: string, v: Visit) {
    const config: Record<string, any> = {
      reject: { title: 'Reject Visit', icon: 'thumb_down', color: '#f59e0b' },
      cancel: { title: 'Cancel Visit', icon: 'cancel', color: '#ef4444' },
      block: { title: 'Block Visitor', icon: 'block', color: '#475569' },
    };
    const c = config[type];
    this.actionModal = {
      open: true, type, title: c.title, icon: c.icon, color: c.color,
      visitId: v.id, visitorName: v.visitor_name, visitNo: v.visit_no || '',
      reason: '', severity: 'high', saving: false, error: ''
    };
  }

  confirmAction() {
    const m = this.actionModal;
    if (!m.reason) { m.error = 'Reason is required'; return; }
    m.saving = true;
    m.error = '';
    const done = () => { m.saving = false; m.open = false; this.load(); this.cdr.markForCheck(); };
    const fail = (e: any) => { m.saving = false; m.error = e.error?.error || 'Action failed'; this.cdr.markForCheck(); };
    if (m.type === 'reject') {
      this.svc.approve(m.visitId, 'reject', m.reason).subscribe({ next: done, error: fail });
    } else if (m.type === 'cancel') {
      this.svc.cancel(m.visitId, m.reason).subscribe({ next: done, error: fail });
    } else if (m.type === 'block') {
      this.svc.block(m.visitId, m.reason, m.severity).subscribe({ next: done, error: fail });
    }
  }
}
