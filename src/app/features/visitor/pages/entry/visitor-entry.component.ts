import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VisitorService, Visit, Gate } from '../../services/visitor.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-visitor-entry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <button class="back-btn" (click)="goBack()"><span class="material-icons-round">arrow_back</span></button>
        <h1><span class="material-icons-round">login</span> Visitor Entry</h1>
      </div>

      <!-- Phone Lookup -->
      <div class="lookup-bar">
        <div class="lookup-field">
          <span class="material-icons-round">phone</span>
          <input placeholder="Enter mobile number to fetch visitor details..." [(ngModel)]="lookupPhone" (keyup.enter)="lookupByPhone()">
          <button (click)="lookupByPhone()" [disabled]="!lookupPhone">Lookup</button>
        </div>
        <span *ngIf="lookupMsg" class="lookup-msg" [class.found]="lookupFound">{{ lookupMsg }}</span>

        <!-- Walk-in button -->
        <button class="btn-walkin" *ngIf="!selectedVisit && !walkIn" (click)="startWalkIn()">
          <span class="material-icons-round">person_add</span> Walk-in (No Appointment)
        </button>
      </div>

      <!-- Tabs -->
      <div class="tabs" *ngIf="!selectedVisit && !walkIn">
        <button [class.active]="tab==='today'" (click)="switchTab('today')">
          <span class="material-icons-round">today</span> Today's Expected ({{ queue.length }})
        </button>
        <button [class.active]="tab==='inside'" (click)="switchTab('inside')">
          <span class="material-icons-round">group</span> Currently Inside ({{ insideList.length }})
        </button>
        <button [class.active]="tab==='upcoming'" (click)="switchTab('upcoming')">
          <span class="material-icons-round">event_upcoming</span> Upcoming ({{ upcomingList.length }})
        </button>
      </div>

      <!-- ==== TAB 1: Today's Expected Visitors ==== -->
      <div class="section" *ngIf="tab==='today' && !selectedVisit && !walkIn">
        <div *ngIf="!queue.length" class="empty">
          <span class="material-icons-round">event_busy</span> No expected visitors for today
        </div>
        <table class="data-table" *ngIf="queue.length">
          <thead><tr><th>Visit #</th><th>Visitor</th><th>Company</th><th>Category</th><th>Phone</th><th>Expected</th><th>Host / Dept</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let v of queue" class="clickable" (click)="selectVisit(v)">
              <td>{{ v.visit_no }}</td>
              <td><strong>{{ v.visitor_name }}</strong></td>
              <td>{{ v.visitor_company || '—' }}</td>
              <td><span class="cat-badge">{{ v.visitor_type }}</span></td>
              <td>{{ v.visitor_phone || '—' }}</td>
              <td>{{ v.expected_arrival || '—' }}</td>
              <td>{{ v.host_name }} / {{ v.host_department }}</td>
              <td><span class="status-badge" [attr.data-status]="v.approval_status || v.status">{{ formatStatus(v.status) }}</span></td>
              <td class="action-cell" (click)="$event.stopPropagation()">
                <button class="btn-sm purple" (click)="selectVisit(v)" title="Check In"><span class="material-icons-round">how_to_reg</span></button>
                <button class="btn-sm blue" (click)="viewDetail(v)" title="View"><span class="material-icons-round">visibility</span></button>
                <button class="btn-sm amber" *ngIf="v.status==='pending_approval'" (click)="quickReject(v)" title="Reject"><span class="material-icons-round">thumb_down</span></button>
                <button class="btn-sm red" (click)="quickCancel(v)" title="Cancel"><span class="material-icons-round">cancel</span></button>
                <button class="btn-sm dark" (click)="quickBlock(v)" title="Block"><span class="material-icons-round">block</span></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ==== TAB 2: Currently Inside ==== -->
      <div class="section" *ngIf="tab==='inside' && !selectedVisit && !walkIn">
        <div *ngIf="!insideList.length" class="empty">
          <span class="material-icons-round">check_circle</span> No visitors currently inside
        </div>
        <table class="data-table" *ngIf="insideList.length">
          <thead><tr><th>Badge</th><th>Visitor</th><th>Company</th><th>Phone</th><th>Host / Dept</th><th>Entry Time</th><th>Entry By</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let v of insideList">
              <td><strong>{{ v.badge_no }}</strong></td>
              <td>{{ v.visitor_name }}</td>
              <td>{{ v.visitor_company || '—' }}</td>
              <td>{{ v.visitor_phone || '—' }}</td>
              <td>{{ v.host_name }} / {{ v.host_department }}</td>
              <td>{{ v.entry_time | date:'HH:mm' }}</td>
              <td>{{ v.entry_by }}</td>
              <td class="action-cell">
                <button class="btn-sm blue" (click)="viewDetail(v)" title="View"><span class="material-icons-round">visibility</span></button>
                <button class="btn-sm dark" (click)="quickBlock(v)" title="Block"><span class="material-icons-round">block</span></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ==== TAB 3: Upcoming Visitors ==== -->
      <div class="section" *ngIf="tab==='upcoming' && !selectedVisit && !walkIn">
        <div *ngIf="!upcomingList.length" class="empty">
          <span class="material-icons-round">event_available</span> No upcoming visitors scheduled
        </div>
        <table class="data-table" *ngIf="upcomingList.length">
          <thead><tr><th>Visit #</th><th>Visitor</th><th>Company</th><th>Category</th><th>Visit Date</th><th>Expected Time</th><th>Host / Dept</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr *ngFor="let v of upcomingList" class="clickable" (click)="selectVisit(v)">
              <td>{{ v.visit_no }}</td>
              <td><strong>{{ v.visitor_name }}</strong></td>
              <td>{{ v.visitor_company || '—' }}</td>
              <td><span class="cat-badge">{{ v.visitor_type }}</span></td>
              <td>{{ v.visit_date | date:'dd-MMM-yyyy' }}</td>
              <td>{{ v.expected_arrival || '—' }}</td>
              <td>{{ v.host_name }} / {{ v.host_department }}</td>
              <td><span class="status-badge" [attr.data-status]="v.status">{{ formatStatus(v.status) }}</span></td>
              <td class="action-cell" (click)="$event.stopPropagation()">
                <button class="btn-sm blue" (click)="viewDetail(v)" title="View"><span class="material-icons-round">visibility</span></button>
                <button class="btn-sm amber" *ngIf="v.status==='pending_approval'" (click)="quickReject(v)" title="Reject"><span class="material-icons-round">thumb_down</span></button>
                <button class="btn-sm red" (click)="quickCancel(v)" title="Cancel"><span class="material-icons-round">cancel</span></button>
                <button class="btn-sm dark" (click)="quickBlock(v)" title="Block"><span class="material-icons-round">block</span></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ==== VISITOR DETAIL PANEL ==== -->
      <div class="detail-panel" *ngIf="detailVisit && !selectedVisit && !walkIn">
        <div class="detail-header">
          <h3><span class="material-icons-round">person</span> {{ detailVisit.visitor_name }} — {{ detailVisit.visit_no }}</h3>
          <button class="btn-cancel" (click)="detailVisit=null">Close</button>
        </div>
        <div class="detail-grid">
          <div><label>Category</label><span>{{ detailVisit.visitor_type }}</span></div>
          <div><label>Company</label><span>{{ detailVisit.visitor_company || '—' }}</span></div>
          <div><label>Phone</label><span>{{ detailVisit.visitor_phone || '—' }}</span></div>
          <div><label>Email</label><span>{{ detailVisit.visitor_email || '—' }}</span></div>
          <div><label>Purpose</label><span>{{ detailVisit.purpose }}</span></div>
          <div><label>Visit Date</label><span>{{ detailVisit.visit_date | date:'dd-MMM-yyyy' }}{{ detailVisit.visit_date_to ? ' — ' + (detailVisit.visit_date_to | date:'dd-MMM-yyyy') : '' }}</span></div>
          <div><label>Expected</label><span>{{ detailVisit.expected_arrival || '—' }} — {{ detailVisit.expected_departure || '—' }}</span></div>
          <div><label>Host</label><span>{{ detailVisit.host_name }} / {{ detailVisit.host_department }}</span></div>
          <div><label>Status</label><span class="status-badge" [attr.data-status]="detailVisit.status">{{ formatStatus(detailVisit.status) }}</span></div>
          <div *ngIf="detailVisit.badge_no"><label>Badge</label><span>{{ detailVisit.badge_no }}</span></div>
          <div *ngIf="detailVisit.pass_no"><label>Pass No</label><span>{{ detailVisit.pass_no }}</span></div>
          <div *ngIf="detailVisit.entry_time"><label>Entry Time</label><span>{{ detailVisit.entry_time | date:'dd-MMM HH:mm' }}</span></div>
          <div *ngIf="detailVisit.entry_by"><label>Entry By</label><span>{{ detailVisit.entry_by }}</span></div>
          <div *ngIf="detailVisit.entry_gate"><label>Entry Gate</label><span>{{ detailVisit.entry_gate }}</span></div>
          <div *ngIf="detailVisit.exit_time"><label>Exit Time</label><span>{{ detailVisit.exit_time | date:'dd-MMM HH:mm' }}</span></div>
          <div *ngIf="detailVisit.exit_by"><label>Exit By</label><span>{{ detailVisit.exit_by }}</span></div>
          <div *ngIf="detailVisit.special_instructions"><label>Instructions</label><span>{{ detailVisit.special_instructions }}</span></div>
          <div *ngIf="detailVisit.items_carried"><label>Items</label><span>{{ detailVisit.items_carried }}</span></div>
          <div *ngIf="detailVisit.vehicle_no"><label>Vehicle</label><span>{{ detailVisit.vehicle_no }}</span></div>
          <div *ngIf="detailVisit.remarks"><label>Remarks</label><span>{{ detailVisit.remarks }}</span></div>
          <div *ngIf="detailVisit.id_type"><label>ID Type</label><span>{{ detailVisit.id_type }}</span></div>
          <div *ngIf="detailVisit.id_number"><label>ID Number</label><span>{{ detailVisit.id_number }}</span></div>
        </div>
        <div class="detail-actions">
          <button class="btn-sm-label purple" *ngIf="['scheduled','approved','pending_approval'].includes(detailVisit.status)" (click)="selectVisit(detailVisit); detailVisit=null">
            <span class="material-icons-round">how_to_reg</span> Check In
          </button>
          <button class="btn-sm-label amber" *ngIf="detailVisit.status==='pending_approval'" (click)="quickReject(detailVisit)">
            <span class="material-icons-round">thumb_down</span> Reject
          </button>
          <button class="btn-sm-label red" *ngIf="['scheduled','approved','pending_approval'].includes(detailVisit.status)" (click)="quickCancel(detailVisit)">
            <span class="material-icons-round">cancel</span> Cancel
          </button>
          <button class="btn-sm-label dark" (click)="quickBlock(detailVisit)">
            <span class="material-icons-round">block</span> Block Visitor
          </button>
        </div>
      </div>

      <!-- ==== CHECK-IN FORM ==== -->
      <div class="checkin-form" *ngIf="selectedVisit || walkIn">
        <div class="form-header">
          <h3 *ngIf="selectedVisit"><span class="material-icons-round">how_to_reg</span> Check In: {{ selectedVisit!.visitor_name }} ({{ selectedVisit!.visit_no }})</h3>
          <h3 *ngIf="walkIn"><span class="material-icons-round">person_add</span> Walk-in Check In</h3>
          <button class="btn-cancel" (click)="cancelForm()">Cancel</button>
        </div>

        <div class="form-body">
          <!-- Walk-in fields only -->
          <div *ngIf="walkIn" class="row">
            <div class="field"><label>Visitor Name *</label><input [(ngModel)]="ci.visitor_name"></div>
            <div class="field"><label>Category</label>
              <select [(ngModel)]="ci.visitor_type">
                <option *ngFor="let t of visitorTypes" [value]="t">{{ t }}</option>
              </select>
            </div>
            <div class="field"><label>Company</label><input [(ngModel)]="ci.visitor_company"></div>
          </div>
          <div *ngIf="walkIn" class="row">
            <div class="field"><label>Phone</label><input [(ngModel)]="ci.visitor_phone" (blur)="autoLookup()"></div>
            <div class="field"><label>Purpose *</label><input [(ngModel)]="ci.purpose"></div>
            <div class="field"><label>Host Name *</label><input [(ngModel)]="ci.host_name"></div>
            <div class="field"><label>Host Dept *</label>
              <select [(ngModel)]="ci.host_department">
                <option value="">Select...</option>
                <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
              </select>
            </div>
          </div>

          <!-- Common check-in fields -->
          <div class="row">
            <div class="field" *ngIf="s['feature_photo']!=='off'">
              <label>Photo {{ s['feature_photo']==='mandatory' ? '*' : '' }}</label>
              <div class="photo-area">
                <video #videoEl *ngIf="cameraOn" autoplay playsinline class="video-preview"></video>
                <img *ngIf="ci.photo_data && !cameraOn" [src]="ci.photo_data" class="photo-preview">
                <div class="photo-btns">
                  <button type="button" (click)="startCamera()" *ngIf="!cameraOn && !ci.photo_data" class="btn-sm purple">
                    <span class="material-icons-round">photo_camera</span> Open Camera
                  </button>
                  <button type="button" (click)="capturePhoto()" *ngIf="cameraOn" class="btn-sm green">
                    <span class="material-icons-round">camera</span> Capture
                  </button>
                  <button type="button" (click)="clearPhoto()" *ngIf="ci.photo_data" class="btn-sm red">Clear</button>
                </div>
              </div>
            </div>
            <div class="field" *ngIf="s['feature_id_proof']!=='off'">
              <label>ID Type</label>
              <select [(ngModel)]="ci.id_type">
                <option value="">Select...</option>
                <option *ngFor="let t of idTypes" [value]="t">{{ t }}</option>
              </select>
              <label style="margin-top:6px">ID Number</label>
              <input [(ngModel)]="ci.id_number">
              <label style="margin-top:6px">ID Proof (upload)</label>
              <input type="file" accept="image/*" (change)="onFileChange($event, 'id_proof_data')">
            </div>
            <div class="field" *ngIf="s['feature_address_proof']!=='off'">
              <label>Address Proof (upload)</label>
              <input type="file" accept="image/*" (change)="onFileChange($event, 'address_proof_data')">
            </div>
          </div>

          <div class="row">
            <div class="field"><label>Entry Gate</label>
              <select [(ngModel)]="ci.entry_gate">
                <option value="">Select...</option>
                <option *ngFor="let g of gates" [value]="g.name">{{ g.name }}</option>
              </select>
            </div>
            <div class="field"><label>Badge #</label><input [(ngModel)]="ci.badge_no" placeholder="Auto-generated if blank"></div>
            <div class="field" *ngIf="s['feature_vehicle_tracking']!=='off'"><label>Vehicle No</label><input [(ngModel)]="ci.vehicle_no"></div>
          </div>

          <!-- Approval section -->
          <fieldset class="approval-section" *ngIf="selectedVisit?.status === 'pending_approval' || walkIn">
            <legend>Approval</legend>
            <div class="row">
              <div class="field" *ngIf="walkIn">
                <label class="toggle-label">
                  <input type="checkbox" [(ngModel)]="ci.requires_approval"> Requires Approval
                </label>
              </div>
              <div class="field">
                <label class="toggle-label">
                  <input type="checkbox" [(ngModel)]="ci.bypass"> Bypass Approval (oral/verbal)
                </label>
              </div>
            </div>
            <div class="row" *ngIf="ci.bypass">
              <div class="field full"><label>Bypass Reason *</label><input [(ngModel)]="ci.bypass_reason" placeholder="e.g. Verbal approval from HOD"></div>
            </div>
          </fieldset>

          <div class="row">
            <div class="field full"><label>Remarks</label><input [(ngModel)]="ci.remarks"></div>
          </div>

          <div *ngIf="error" class="alert error"><span class="material-icons-round">error</span> {{ error }}</div>
          <div *ngIf="successMsg" class="alert success"><span class="material-icons-round">check_circle</span> {{ successMsg }}</div>

          <div class="actions">
            <div class="action-left">
              <button type="button" class="btn-reject" *ngIf="selectedVisit && selectedVisit.status==='pending_approval'" (click)="rejectVisit()" [disabled]="saving">
                <span class="material-icons-round">thumb_down</span> Reject
              </button>
              <button type="button" class="btn-cancel-visit" *ngIf="selectedVisit" (click)="cancelVisit()" [disabled]="saving">
                <span class="material-icons-round">cancel</span> Cancel Visit
              </button>
              <button type="button" class="btn-block" *ngIf="selectedVisit" (click)="blockVisitor()" [disabled]="saving">
                <span class="material-icons-round">block</span> Block
              </button>
            </div>
            <button class="btn-submit" (click)="doCheckin()" [disabled]="saving">
              <span class="material-icons-round">how_to_reg</span> {{ saving ? 'Processing...' : 'Complete Check In' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ==== ACTION MODAL ==== -->
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

      <canvas #canvasEl style="display:none"></canvas>
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
    .lookup-bar { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; flex-wrap: wrap; }
    .lookup-field { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px 14px; flex: 1; max-width: 480px;
      .material-icons-round { color: #94a3b8; font-size: 20px; }
      input { border: none; outline: none; flex: 1; font-size: .88rem; padding: 6px 0; }
      button { padding: 6px 16px; background: #8b5cf6; color: #fff; border: none; border-radius: 6px; font-size: .82rem; font-weight: 600; cursor: pointer; &:hover { background: #7c3aed; } &:disabled { opacity: .5; } }
    }
    .lookup-msg { font-size: .82rem; color: #ef4444; &.found { color: #22c55e; } }
    .btn-walkin { padding: 8px 18px; border: 2px dashed #8b5cf6; color: #8b5cf6; background: transparent; border-radius: 10px; font-size: .84rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; margin-left: auto;
      &:hover { background: #f5f3ff; }
    }
    .tabs { display: flex; gap: 4px; margin-bottom: 18px;
      button { padding: 9px 18px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer; font-size: .82rem; font-weight: 500; display: flex; align-items: center; gap: 6px;
        .material-icons-round { font-size: 18px; }
        &.active { background: #8b5cf6; color: #fff; border-color: #8b5cf6; }
        &:hover:not(.active) { background: #f8fafc; }
      }
    }
    .section { background: #fff; border-radius: 14px; padding: 16px 20px; margin-bottom: 18px; box-shadow: 0 1px 4px rgba(0,0,0,.06); }
    .empty { text-align: center; padding: 40px; color: #94a3b8; font-size: .9rem;
      .material-icons-round { display: block; font-size: 42px; margin-bottom: 10px; color: #cbd5e1; }
    }
    .data-table { width: 100%; border-collapse: collapse; font-size: .82rem;
      th { text-align: left; padding: 8px 10px; color: #64748b; font-weight: 600; border-bottom: 2px solid #f1f5f9; font-size: .72rem; text-transform: uppercase; }
      td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; }
      tr.clickable { cursor: pointer; &:hover td { background: #f0f0ff; } }
    }
    .cat-badge { padding: 3px 10px; border-radius: 20px; font-size: .72rem; font-weight: 600; background: #ede9fe; color: #7c3aed; }
    .status-badge { padding: 3px 10px; border-radius: 20px; font-size: .72rem; font-weight: 600; text-transform: capitalize;
      &[data-status="approved"], &[data-status="scheduled"] { background: #dcfce7; color: #166534; }
      &[data-status="pending"], &[data-status="pending_approval"] { background: #fef3c7; color: #92400e; }
      &[data-status="checked_in"] { background: #dbeafe; color: #1e40af; }
      &[data-status="rejected"] { background: #fecaca; color: #991b1b; }
      &[data-status="cancelled"] { background: #f1f5f9; color: #64748b; }
    }
    .action-cell { white-space: nowrap; display: flex; gap: 4px; }
    .btn-sm { width: 30px; height: 30px; border: none; border-radius: 6px; cursor: pointer; color: #fff; display: inline-flex; align-items: center; justify-content: center; padding: 0;
      .material-icons-round { font-size: 16px; }
      &.purple { background: #8b5cf6; &:hover { background: #7c3aed; } }
      &.blue { background: #3b82f6; &:hover { background: #2563eb; } }
      &.green { background: #22c55e; &:hover { background: #16a34a; } }
      &.amber { background: #f59e0b; &:hover { background: #d97706; } }
      &.red { background: #ef4444; &:hover { background: #dc2626; } }
      &.dark { background: #475569; &:hover { background: #334155; } }
    }
    .btn-sm-label { padding: 6px 14px; border: none; border-radius: 6px; cursor: pointer; color: #fff; display: inline-flex; align-items: center; gap: 6px; font-size: .8rem; font-weight: 600;
      &.purple { background: #8b5cf6; &:hover { background: #7c3aed; } }
      &.amber { background: #f59e0b; &:hover { background: #d97706; } }
      &.red { background: #ef4444; &:hover { background: #dc2626; } }
      &.dark { background: #475569; &:hover { background: #334155; } }
    }
    /* Detail Panel */
    .detail-panel { background: #fff; border-radius: 14px; padding: 20px 24px; box-shadow: 0 2px 8px rgba(0,0,0,.08); border: 1px solid #e2e8f0; margin-bottom: 18px; }
    .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
      h3 { font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; margin: 0;
        .material-icons-round { color: #8b5cf6; }
      }
    }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px 20px; margin-bottom: 16px;
      > div { display: flex; flex-direction: column; gap: 2px;
        label { font-size: .72rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
        span { font-size: .88rem; color: #1e293b; }
      }
    }
    .detail-actions { display: flex; gap: 8px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid #f1f5f9; }
    /* Check-in Form */
    .checkin-form { background: #fff; border-radius: 14px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,.08); border: 2px solid #8b5cf6; }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;
      h3 { font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 8px; margin: 0; }
    }
    .btn-cancel { padding: 6px 14px; border: 1px solid #e2e8f0; background: #fff; border-radius: 6px; cursor: pointer; font-size: .82rem; &:hover { background: #f1f5f9; } }
    .row { display: flex; gap: 14px; margin-bottom: 12px; flex-wrap: wrap; }
    .field { flex: 1; min-width: 180px; display: flex; flex-direction: column; gap: 4px;
      &.full { flex: 100%; }
      label { font-size: .78rem; font-weight: 600; color: #475569; }
      input, select, textarea { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .85rem;
        &:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,.1); }
      }
    }
    .approval-section { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px 10px; margin-bottom: 12px;
      legend { font-weight: 600; font-size: .85rem; color: #8b5cf6; padding: 0 8px; }
    }
    .toggle-label { display: flex; align-items: center; gap: 8px; font-size: .85rem; cursor: pointer; padding-top: 12px;
      input[type="checkbox"] { width: 18px; height: 18px; accent-color: #8b5cf6; }
    }
    .photo-area { display: flex; flex-direction: column; gap: 8px; }
    .video-preview, .photo-preview { width: 200px; height: 150px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; }
    .photo-btns { display: flex; gap: 8px; }
    .actions { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
    .action-left { display: flex; gap: 8px; }
    .btn-submit { padding: 10px 28px; background: #8b5cf6; color: #fff; border: none; border-radius: 10px; font-size: .9rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;
      &:hover { background: #7c3aed; } &:disabled { opacity: .5; }
    }
    .btn-reject { padding: 8px 16px; background: #f59e0b; color: #fff; border: none; border-radius: 8px; font-size: .82rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;
      &:hover { background: #d97706; } &:disabled { opacity: .5; }
    }
    .btn-cancel-visit { padding: 8px 16px; background: #ef4444; color: #fff; border: none; border-radius: 8px; font-size: .82rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;
      &:hover { background: #dc2626; } &:disabled { opacity: .5; }
    }
    .btn-block { padding: 8px 16px; background: #475569; color: #fff; border: none; border-radius: 8px; font-size: .82rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;
      &:hover { background: #334155; } &:disabled { opacity: .5; }
    }
    .alert { padding: 10px 16px; border-radius: 8px; font-size: .85rem; margin-top: 12px; display: flex; align-items: center; gap: 8px;
      &.error { background: #fef2f2; color: #991b1b; }
      &.success { background: #f0fdf4; color: #166534; }
    }
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
    .btn-confirm { padding: 8px 20px; color: #fff; border: none; border-radius: 8px; font-size: .88rem; font-weight: 600; cursor: pointer;
      &:disabled { opacity: .5; }
    }
  `]
})
export class VisitorEntryComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasEl!: ElementRef<HTMLCanvasElement>;

  tab = 'today';
  queue: Visit[] = [];
  insideList: Visit[] = [];
  upcomingList: Visit[] = [];
  gates: Gate[] = [];
  s: Record<string, string> = {};
  visitorTypes: string[] = [];
  departments: string[] = [];
  idTypes: string[] = [];

  selectedVisit: Visit | null = null;
  detailVisit: Visit | null = null;
  walkIn = false;
  cameraOn = false;
  mediaStream: MediaStream | null = null;

  ci: any = {};
  lookupPhone = '';
  lookupMsg = '';
  lookupFound = false;
  saving = false;
  error = '';
  successMsg = '';

  actionModal = { open: false, type: '', title: '', icon: '', color: '', visitId: 0, visitorName: '', visitNo: '', reason: '', severity: 'high', saving: false, error: '' };

  private refreshTimer: any;

  constructor(private svc: VisitorService, private auth: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadAll();
    this.svc.getGates().subscribe(g => { this.gates = g; this.cdr.markForCheck(); });
    this.svc.getSettings().subscribe(s => {
      this.s = s;
      this.visitorTypes = (s['visitor_types'] || '').split(',').map(t => t.trim()).filter(Boolean);
      this.departments = (s['departments'] || '').split(',').map(d => d.trim()).filter(Boolean);
      this.idTypes = (s['id_types'] || '').split(',').map(t => t.trim()).filter(Boolean);
      this.cdr.markForCheck();
    });
    this.refreshTimer = setInterval(() => this.loadAll(), 30000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.stopCamera();
  }

  goBack() { this.router.navigate(['/visitor/dashboard']); }

  loadAll() {
    this.svc.getCheckInQueue().subscribe(q => { this.queue = q; this.cdr.markForCheck(); });
    this.svc.getCurrentlyInside().subscribe(v => { this.insideList = v; this.cdr.markForCheck(); });
    this.svc.getUpcomingVisitors().subscribe(v => { this.upcomingList = v; this.cdr.markForCheck(); });
  }

  switchTab(t: string) {
    this.tab = t;
    this.detailVisit = null;
  }

  formatStatus(s: string) { return s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || ''; }

  // ─── Phone Lookup ────
  lookupByPhone() {
    if (!this.lookupPhone) return;
    this.svc.lookupByPhone(this.lookupPhone).subscribe(r => {
      if (r.found && r.visitor) {
        this.lookupMsg = `Found: ${r.visitor.visitor_name} (${r.visitor.visitor_company || 'N/A'})`;
        this.lookupFound = true;
        const match = this.queue.find(q => q.visitor_phone === this.lookupPhone);
        if (match) {
          this.selectVisit(match);
        } else {
          if (!this.walkIn) this.startWalkIn();
          this.fillEmptyFields(r.visitor);
        }
      } else {
        this.lookupMsg = 'No previous records found';
        this.lookupFound = false;
      }
      this.cdr.markForCheck();
    });
  }

  autoLookup() {
    if (this.walkIn && this.ci.visitor_phone && this.ci.visitor_phone.length >= 10) {
      this.svc.lookupByPhone(this.ci.visitor_phone).subscribe(r => {
        if (r.found && r.visitor) {
          this.fillEmptyFields(r.visitor);
          this.lookupMsg = `Auto-filled from: ${r.visitor.visitor_name}`;
          this.lookupFound = true;
        }
        this.cdr.markForCheck();
      });
    }
  }

  fillEmptyFields(visitor: any) {
    if (!this.ci.visitor_name && visitor.visitor_name) this.ci.visitor_name = visitor.visitor_name;
    if (!this.ci.visitor_company && visitor.visitor_company) this.ci.visitor_company = visitor.visitor_company;
    if (!this.ci.visitor_phone && visitor.visitor_phone) this.ci.visitor_phone = visitor.visitor_phone;
    if (!this.ci.visitor_email && visitor.visitor_email) this.ci.visitor_email = visitor.visitor_email;
    if (!this.ci.visitor_type && visitor.visitor_type) this.ci.visitor_type = visitor.visitor_type;
    if (!this.ci.id_type && visitor.id_type) this.ci.id_type = visitor.id_type;
    if (!this.ci.id_number && visitor.id_number) this.ci.id_number = visitor.id_number;
    if (!this.ci.vehicle_no && visitor.vehicle_no) this.ci.vehicle_no = visitor.vehicle_no;
    if (!this.ci.emergency_contact && visitor.emergency_contact) this.ci.emergency_contact = visitor.emergency_contact;
  }

  // ─── Select & Walk-in ────
  selectVisit(v: Visit) {
    this.selectedVisit = v;
    this.walkIn = false;
    this.detailVisit = null;
    this.ci = {
      entry_gate: '', badge_no: '', vehicle_no: v.vehicle_no || '',
      bypass: false, bypass_reason: '', requires_approval: false, remarks: ''
    };
    this.error = '';
    this.successMsg = '';
  }

  viewDetail(v: Visit) {
    this.svc.getVisit(v.id).subscribe(full => { this.detailVisit = full; this.cdr.markForCheck(); });
  }

  startWalkIn() {
    this.walkIn = true;
    this.selectedVisit = null;
    this.detailVisit = null;
    this.ci = {
      visitor_type: 'Visitor', visitor_name: '', visitor_company: '', visitor_phone: '',
      purpose: '', host_name: '', host_department: '',
      entry_gate: '', badge_no: '', remarks: '',
      requires_approval: false, bypass: false, bypass_reason: ''
    };
    this.svc.getMyProfile().subscribe(p => {
      if (!this.ci.host_name && p.fullName) this.ci.host_name = p.fullName;
      if (!this.ci.host_department && p.department) this.ci.host_department = p.department;
      this.cdr.markForCheck();
    });
    this.error = '';
    this.successMsg = '';
  }

  cancelForm() {
    this.selectedVisit = null;
    this.walkIn = false;
    this.stopCamera();
  }

  // ─── Camera ────
  async startCamera() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } });
      this.cameraOn = true;
      setTimeout(() => {
        if (this.videoEl?.nativeElement) this.videoEl.nativeElement.srcObject = this.mediaStream;
      }, 100);
    } catch { this.error = 'Camera access denied'; }
  }

  capturePhoto() {
    if (!this.videoEl?.nativeElement || !this.canvasEl?.nativeElement) return;
    const video = this.videoEl.nativeElement;
    const canvas = this.canvasEl.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    this.ci.photo_data = canvas.toDataURL('image/jpeg', 0.7);
    this.stopCamera();
  }

  clearPhoto() { this.ci.photo_data = null; }

  stopCamera() {
    this.cameraOn = false;
    this.mediaStream?.getTracks().forEach(t => t.stop());
    this.mediaStream = null;
  }

  onFileChange(event: Event, field: string) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.ci[field] = reader.result as string; };
    reader.readAsDataURL(file);
  }

  // ─── Check-in ────
  doCheckin() {
    this.error = '';
    this.successMsg = '';

    if (this.walkIn) {
      if (!this.ci.visitor_name || !this.ci.purpose || !this.ci.host_name || !this.ci.host_department) {
        this.error = 'Please fill visitor name, purpose, host name and department';
        return;
      }
      if (this.ci.bypass && !this.ci.bypass_reason) {
        this.error = 'Please provide bypass reason';
        return;
      }
      this.saving = true;
      const bookData = {
        ...this.ci,
        visit_date: new Date().toISOString().slice(0, 10),
        booked_by_role: 'reception',
        requires_approval: this.ci.requires_approval || false,
        bypass_approval: this.ci.bypass || !this.ci.requires_approval,
        bypass_reason: this.ci.bypass ? this.ci.bypass_reason : (this.ci.requires_approval ? '' : 'Walk-in visitor — reception entry'),
      };
      this.svc.bookVisit(bookData).subscribe({
        next: (r) => {
          if (bookData.requires_approval && !bookData.bypass_approval) {
            this.successMsg = `Visit ${r.visit_no} booked. Status: Pending Approval`;
            this.saving = false;
            this.cdr.markForCheck();
            this.loadAll();
          } else {
            this.svc.checkin(r.id, this.ci).subscribe({
              next: (cr) => {
                this.successMsg = `Checked in! Badge: ${cr.badge_no}, Pass: ${cr.pass_no}`;
                this.saving = false;
                this.cdr.markForCheck();
                this.loadAll();
              },
              error: (e) => { this.error = e.error?.error || 'Check-in failed'; this.saving = false; this.cdr.markForCheck(); }
            });
          }
        },
        error: (e) => { this.error = e.error?.error || 'Booking failed'; this.saving = false; this.cdr.markForCheck(); }
      });
    } else if (this.selectedVisit) {
      if (this.ci.bypass && !this.ci.bypass_reason) {
        this.error = 'Please provide bypass reason';
        return;
      }
      this.saving = true;
      this.svc.checkin(this.selectedVisit.id, {
        ...this.ci,
        bypass_reason: this.ci.bypass ? this.ci.bypass_reason : null,
      }).subscribe({
        next: (r) => {
          this.successMsg = `Checked in! Badge: ${r.badge_no}, Pass: ${r.pass_no}`;
          this.saving = false;
          this.cdr.markForCheck();
          this.loadAll();
        },
        error: (e) => { this.error = e.error?.error || 'Check-in failed'; this.saving = false; this.cdr.markForCheck(); }
      });
    }
  }

  // ─── Reject / Cancel / Block ────
  rejectVisit() { if (this.selectedVisit) this.openModal('reject', this.selectedVisit); }
  cancelVisit() { if (this.selectedVisit) this.openModal('cancel', this.selectedVisit); }
  blockVisitor() { if (this.selectedVisit) this.openModal('block', this.selectedVisit); }
  quickReject(v: Visit) { this.openModal('reject', v); }
  quickCancel(v: Visit) { this.openModal('cancel', v); }
  quickBlock(v: Visit) { this.openModal('block', v); }

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

    const done = () => {
      m.saving = false;
      m.open = false;
      this.loadAll();
      if (this.selectedVisit?.id === m.visitId) { this.selectedVisit = null; this.walkIn = false; }
      if (this.detailVisit?.id === m.visitId) { this.detailVisit = null; }
      this.cdr.markForCheck();
    };
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
