import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VisitorService, Analytics } from '../../services/visitor.service';

@Component({
  selector: 'app-visitor-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="header">
        <div class="page-header"><button class="back-btn" (click)="goBack()"><span class="material-icons-round">arrow_back</span></button>
        <h1><span class="material-icons-round">bar_chart</span> Analytics</h1></div>
        <div class="filters">
          <input type="date" [(ngModel)]="from" (change)="load()">
          <span>to</span>
          <input type="date" [(ngModel)]="to" (change)="load()">
          <button class="btn-primary" (click)="load()"><span class="material-icons-round">search</span></button>
        </div>
      </div>

      <div *ngIf="data" class="content">
        <!-- Summary Cards -->
        <div class="summary-row">
          <div class="sum-card"><span class="sum-val">{{ data.totalVisits }}</span><span class="sum-lbl">Total Visits</span></div>
          <div class="sum-card"><span class="sum-val">{{ data.totalHeadcount }}</span><span class="sum-lbl">Total Headcount</span></div>
          <div class="sum-card"><span class="sum-val">{{ data.avgDurationMinutes }}m</span><span class="sum-lbl">Avg Duration</span></div>
          <div class="sum-card"><span class="sum-val">{{ data.approvalStats?.approved || 0 }}</span><span class="sum-lbl">Approved</span></div>
          <div class="sum-card"><span class="sum-val">{{ data.approvalStats?.rejected || 0 }}</span><span class="sum-lbl">Rejected</span></div>
          <div class="sum-card"><span class="sum-val">{{ data.approvalStats?.bypassed || 0 }}</span><span class="sum-lbl">Bypassed</span></div>
        </div>

        <div class="grid-2">
          <!-- Daily Trend -->
          <div class="card">
            <h3>Daily Visitor Count</h3>
            <div class="bar-chart">
              <div class="bar-row" *ngFor="let d of data.dailyCounts">
                <span class="bar-label">{{ d.date | date:'dd MMM' }}</span>
                <div class="bar-track"><div class="bar-fill" [style.width.%]="barPct(d.count, maxDaily)"></div></div>
                <span class="bar-val">{{ d.count }}</span>
              </div>
              <div *ngIf="!data.dailyCounts.length" class="empty">No data</div>
            </div>
          </div>

          <!-- Visitor Category -->
          <div class="card">
            <h3>By Category</h3>
            <div class="bar-chart">
              <div class="bar-row" *ngFor="let t of data.typeBreakdown">
                <span class="bar-label">{{ t.visitor_type }}</span>
                <div class="bar-track"><div class="bar-fill purple" [style.width.%]="barPct(t.count, maxType)"></div></div>
                <span class="bar-val">{{ t.count }}</span>
              </div>
              <div *ngIf="!data.typeBreakdown.length" class="empty">No data</div>
            </div>
          </div>

          <!-- Department -->
          <div class="card">
            <h3>By Department</h3>
            <div class="bar-chart">
              <div class="bar-row" *ngFor="let d of data.deptBreakdown">
                <span class="bar-label">{{ d.host_department }}</span>
                <div class="bar-track"><div class="bar-fill teal" [style.width.%]="barPct(d.count, maxDept)"></div></div>
                <span class="bar-val">{{ d.count }}</span>
              </div>
            </div>
          </div>

          <!-- Status -->
          <div class="card">
            <h3>By Status</h3>
            <div class="bar-chart">
              <div class="bar-row" *ngFor="let s of data.statusBreakdown">
                <span class="bar-label">{{ formatStatus(s.status) }}</span>
                <div class="bar-track"><div class="bar-fill amber" [style.width.%]="barPct(s.count, maxStatus)"></div></div>
                <span class="bar-val">{{ s.count }}</span>
              </div>
            </div>
          </div>

          <!-- Peak Hours -->
          <div class="card">
            <h3>Peak Entry Hours</h3>
            <div class="bar-chart">
              <div class="bar-row" *ngFor="let h of data.peakHours">
                <span class="bar-label">{{ h.hour }}:00</span>
                <div class="bar-track"><div class="bar-fill blue" [style.width.%]="barPct(h.count, maxHour)"></div></div>
                <span class="bar-val">{{ h.count }}</span>
              </div>
              <div *ngIf="!data.peakHours.length" class="empty">No data</div>
            </div>
          </div>

          <!-- Top Hosts -->
          <div class="card">
            <h3>Top Hosts</h3>
            <table class="mini-table">
              <thead><tr><th>Host</th><th>Dept</th><th>Visits</th></tr></thead>
              <tbody>
                <tr *ngFor="let h of data.topHosts">
                  <td>{{ h.host_name }}</td><td>{{ h.host_department }}</td><td><strong>{{ h.count }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Security Activity -->
          <div class="card" *ngIf="data.securityActivity.length">
            <h3>Security Personnel Activity</h3>
            <table class="mini-table">
              <thead><tr><th>Officer</th><th>Action</th><th>Count</th></tr></thead>
              <tbody>
                <tr *ngFor="let a of data.securityActivity">
                  <td>{{ a.performed_by }}</td><td>{{ a.action }}</td><td><strong>{{ a.count }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div *ngIf="!data" class="loading">Loading analytics...</div>
    </div>
  `,
  styles: [`
    .page { padding: 24px 28px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
      h1 { font-size: 1.4rem; font-weight: 700; display: flex; align-items: center; gap: 10px; margin: 0;
        .material-icons-round { color: #8b5cf6; }
      }
    }
    .filters { display: flex; align-items: center; gap: 8px;
      input { padding: 7px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .85rem; }
      span { color: #64748b; font-size: .85rem; }
    }
    .btn-primary { padding: 8px 12px; background: #8b5cf6; color: #fff; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center;
      .material-icons-round { font-size: 18px; }
      &:hover { background: #7c3aed; }
    }
    .summary-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 14px; margin-bottom: 24px; }
    .sum-card { background: #fff; border-radius: 12px; padding: 18px 16px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,.06); display: flex; flex-direction: column;
      .sum-val { font-size: 1.4rem; font-weight: 700; color: #8b5cf6; }
      .sum-lbl { font-size: .72rem; color: #64748b; margin-top: 2px; text-transform: uppercase; }
    }
    .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 18px; }
    .card { background: #fff; border-radius: 14px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,.06);
      h3 { font-size: .9rem; font-weight: 600; margin: 0 0 14px; }
    }
    .bar-chart { display: flex; flex-direction: column; gap: 8px; }
    .bar-row { display: flex; align-items: center; gap: 10px; }
    .bar-label { width: 80px; font-size: .78rem; color: #475569; text-align: right; flex-shrink: 0; }
    .bar-track { flex: 1; height: 18px; background: #f1f5f9; border-radius: 6px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 6px; background: #8b5cf6; min-width: 2px; transition: width .3s;
      &.purple { background: #a78bfa; } &.teal { background: #14b8a6; } &.amber { background: #f59e0b; } &.blue { background: #3b82f6; }
    }
    .bar-val { font-size: .78rem; font-weight: 600; color: #334155; width: 30px; }
    .mini-table { width: 100%; border-collapse: collapse; font-size: .8rem;
      th { text-align: left; padding: 6px 8px; color: #64748b; font-weight: 600; border-bottom: 2px solid #f1f5f9; font-size: .72rem; text-transform: uppercase; }
      td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
    }
    .empty { color: #94a3b8; font-size: .82rem; padding: 10px 0; }
    .loading { text-align: center; padding: 60px; color: #94a3b8; }
    .page-header { display: flex; align-items: center; gap: 10px; }
    .back-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover { background: #f1f5f9; } .material-icons-round { font-size: 20px; color: #64748b; } }
  `]
})
export class VisitorAnalyticsComponent implements OnInit {
  data: Analytics | null = null;
  from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  to = new Date().toISOString().slice(0, 10);
  maxDaily = 1; maxType = 1; maxDept = 1; maxStatus = 1; maxHour = 1;

  constructor(private svc: VisitorService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.load(); }

  goBack() { this.router.navigate(['/visitor/dashboard']); }

  load() {
    this.svc.getAnalytics(this.from, this.to).subscribe(d => {
      this.data = d;
      this.maxDaily = Math.max(1, ...d.dailyCounts.map(x => x.count));
      this.maxType = Math.max(1, ...d.typeBreakdown.map(x => x.count));
      this.maxDept = Math.max(1, ...d.deptBreakdown.map(x => x.count));
      this.maxStatus = Math.max(1, ...d.statusBreakdown.map(x => x.count));
      this.maxHour = Math.max(1, ...d.peakHours.map(x => x.count));
      this.cdr.markForCheck();
    });
  }

  barPct(val: number, max: number) { return Math.round((val / max) * 100); }

  formatStatus(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
}
