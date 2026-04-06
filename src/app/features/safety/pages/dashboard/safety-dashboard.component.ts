import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SafetyService, SafetyStats } from '../../services/safety.service';

@Component({
  selector: 'app-safety-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <div>
          <h1>Safety Dashboard</h1>
          <p class="subtitle">Real-time safety performance overview</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-danger" routerLink="../incidents"><span class="material-icons-round">add_alert</span>Report Incident</button>
        </div>
      </div>

      <!-- Hero KPI Strip -->
      <div class="hero-strip">
        <div class="hero-card lti-card">
          <div class="hero-number">{{ stats?.daysSinceLastLTI ?? '—' }}</div>
          <div class="hero-label">Days Since Last LTI</div>
          <span class="material-icons-round hero-icon">shield</span>
        </div>
        <div class="hero-card" [class.alert]="(stats?.openIncidents ?? 0) > 0">
          <div class="hero-number">{{ stats?.openIncidents ?? 0 }}</div>
          <div class="hero-label">Open Incidents</div>
          <span class="material-icons-round hero-icon">report_problem</span>
        </div>
        <div class="hero-card" [class.alert]="(stats?.criticalIncidents ?? 0) > 0">
          <div class="hero-number">{{ stats?.criticalIncidents ?? 0 }}</div>
          <div class="hero-label">Critical</div>
          <span class="material-icons-round hero-icon">warning</span>
        </div>
        <div class="hero-card">
          <div class="hero-number">{{ stats?.avgAuditScore ?? '—' }}%</div>
          <div class="hero-label">Avg Audit Score</div>
          <span class="material-icons-round hero-icon">verified</span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card green">
          <span class="material-icons-round">assignment_turned_in</span>
          <div><div class="stat-val">{{ stats?.activePermits ?? 0 }}</div><div class="stat-lbl">Active Permits</div></div>
          <span class="badge pending" *ngIf="(stats?.pendingPermits ?? 0) > 0">{{ stats?.pendingPermits }} pending</span>
        </div>
        <div class="stat-card blue">
          <span class="material-icons-round">school</span>
          <div><div class="stat-val">{{ stats?.completedTrainings ?? 0 }}</div><div class="stat-lbl">Trainings Completed</div></div>
          <span class="badge info" *ngIf="(stats?.upcomingTrainingCount ?? 0) > 0">{{ stats?.upcomingTrainingCount }} upcoming</span>
        </div>
        <div class="stat-card purple">
          <span class="material-icons-round">visibility</span>
          <div><div class="stat-val">{{ stats?.totalObservations ?? 0 }}</div><div class="stat-lbl">Total Observations</div></div>
          <span class="badge warn" *ngIf="(stats?.unsafeObservations ?? 0) > 0">{{ stats?.unsafeObservations }} unsafe open</span>
        </div>
        <div class="stat-card teal">
          <span class="material-icons-round">masks</span>
          <div><div class="stat-val">{{ stats?.ppeIssuedThisMonth ?? 0 }}</div><div class="stat-lbl">PPE Issued This Month</div></div>
        </div>
        <div class="stat-card orange">
          <span class="material-icons-round">fact_check</span>
          <div><div class="stat-val">{{ stats?.inspectionsThisMonth ?? 0 }}</div><div class="stat-lbl">Inspections This Month</div></div>
        </div>
        <div class="stat-card red">
          <span class="material-icons-round">report</span>
          <div><div class="stat-val">{{ stats?.totalIncidents ?? 0 }}</div><div class="stat-lbl">Total Incidents</div></div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Incident by Type -->
        <div class="card">
          <h3><span class="material-icons-round">donut_large</span>Incidents by Type</h3>
          <div class="breakdown-list">
            @for (item of stats?.incidentByType ?? []; track item.incident_type) {
              <div class="breakdown-row">
                <span class="dot" [style.background]="typeColor(item.incident_type)"></span>
                <span class="lbl">{{ formatType(item.incident_type) }}</span>
                <span class="val">{{ item.count }}</span>
                <div class="bar-bg"><div class="bar-fill" [style.width.%]="barPercent(item.count, stats?.totalIncidents)" [style.background]="typeColor(item.incident_type)"></div></div>
              </div>
            }
            @if (!(stats?.incidentByType?.length)) { <p class="empty">No incidents recorded</p> }
          </div>
        </div>

        <!-- Severity Breakdown -->
        <div class="card">
          <h3><span class="material-icons-round">speed</span>Severity Breakdown</h3>
          <div class="severity-grid">
            @for (s of stats?.severityBreakdown ?? []; track s.severity) {
              <div class="severity-block" [attr.data-sev]="s.severity">
                <div class="sev-val">{{ s.count }}</div>
                <div class="sev-label">{{ s.severity | titlecase }}</div>
              </div>
            }
          </div>
          <h4 style="margin-top:1.5rem">By Department</h4>
          <div class="dept-list">
            @for (d of stats?.incidentByDept ?? []; track d.department) {
              <div class="dept-row">
                <span>{{ d.department }}</span>
                <span class="dept-count">{{ d.count }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Recent Incidents -->
        <div class="card">
          <h3><span class="material-icons-round">history</span>Recent Incidents</h3>
          <div class="recent-list">
            @for (inc of stats?.recentIncidents ?? []; track inc.id) {
              <div class="recent-item">
                <div class="ri-top">
                  <span class="badge" [attr.data-sev]="inc.severity">{{ inc.severity }}</span>
                  <span class="badge type-badge">{{ formatType(inc.incident_type) }}</span>
                  <span class="ri-no">{{ inc.incident_no }}</span>
                </div>
                <div class="ri-title">{{ inc.title }}</div>
                <div class="ri-meta">
                  <span><span class="material-icons-round">location_on</span>{{ inc.location }}</span>
                  <span><span class="material-icons-round">calendar_today</span>{{ inc.incident_date | date:'mediumDate' }}</span>
                </div>
              </div>
            }
            @if (!(stats?.recentIncidents?.length)) { <p class="empty">No recent incidents</p> }
          </div>
        </div>

        <!-- Upcoming -->
        <div class="card">
          <h3><span class="material-icons-round">event</span>Upcoming Schedule</h3>
          <h4>Audits</h4>
          @for (a of stats?.upcomingAudits ?? []; track a.id) {
            <div class="schedule-item">
              <span class="material-icons-round si-icon">verified</span>
              <div>
                <div class="si-title">{{ a.audit_no }} — {{ a.department }}</div>
                <div class="si-meta">{{ a.audit_date | date:'mediumDate' }} · {{ a.auditor }} · {{ a.audit_type }}</div>
              </div>
            </div>
          }
          @if (!(stats?.upcomingAudits?.length)) { <p class="empty">No upcoming audits</p> }
          <h4 style="margin-top:1rem">Trainings</h4>
          @for (t of stats?.upcomingTrainings ?? []; track t.id) {
            <div class="schedule-item">
              <span class="material-icons-round si-icon trn">school</span>
              <div>
                <div class="si-title">{{ t.title }}</div>
                <div class="si-meta">{{ t.training_date | date:'mediumDate' }} · {{ t.trainer_name }} · {{ t.attendees_count }} attendees</div>
              </div>
            </div>
          }
          @if (!(stats?.upcomingTrainings?.length)) { <p class="empty">No upcoming trainings</p> }
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <div class="qa-grid">
          <a routerLink="../incidents" class="qa-btn red"><span class="material-icons-round">add_alert</span>Report Incident</a>
          <a routerLink="../permits" class="qa-btn green"><span class="material-icons-round">add_task</span>New Work Permit</a>
          <a routerLink="../observations" class="qa-btn purple"><span class="material-icons-round">visibility</span>Log Observation</a>
          <a routerLink="../inspections" class="qa-btn blue"><span class="material-icons-round">fact_check</span>New Inspection</a>
          <a routerLink="../training" class="qa-btn orange"><span class="material-icons-round">school</span>Schedule Training</a>
          <a routerLink="../ppe" class="qa-btn teal"><span class="material-icons-round">masks</span>Issue PPE</a>
          <a routerLink="../audits" class="qa-btn indigo"><span class="material-icons-round">verified</span>Schedule Audit</a>
          <a routerLink="../reports" class="qa-btn gray"><span class="material-icons-round">assessment</span>Generate Report</a>
        </div>
      </div>
    </div>
  `,
  styleUrl: './safety-dashboard.component.scss',
})
export class SafetyDashboardComponent implements OnInit {
  stats: SafetyStats | null = null;
  constructor(private svc: SafetyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.svc.getStats().subscribe(s => { this.stats = s; this.cdr.markForCheck(); });
  }

  formatType(t: string): string { return (t || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
  typeColor(t: string): string {
    const m: Record<string, string> = { near_miss: '#f59e0b', first_aid: '#3b82f6', medical: '#8b5cf6', lost_time: '#ef4444', lti: '#ef4444', fatality: '#991b1b', property_damage: '#6366f1', fire: '#dc2626', chemical_spill: '#059669', environmental: '#0d9488', other: '#64748b' };
    return m[t] || '#64748b';
  }
  barPercent(val: number, total?: number): number { return total ? Math.round((val / total) * 100) : 0; }
}
