import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-login-log',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1><span class="material-icons-round">login</span> Login Log</h1>
        <p class="subtitle">User login history with IP address and location details</p>
      </div>

      <!-- Stats Bar -->
      @if (stats) {
        <div class="stat-bar">
          <div class="stat-item"><span class="stat-val">{{ stats.total_logins }}</span><span class="stat-lbl">Total (30d)</span></div>
          <div class="stat-item green"><span class="stat-val">{{ stats.successful }}</span><span class="stat-lbl">Successful</span></div>
          <div class="stat-item red"><span class="stat-val">{{ stats.failed }}</span><span class="stat-lbl">Failed</span></div>
          <div class="stat-item blue"><span class="stat-val">{{ stats.unique_users }}</span><span class="stat-lbl">Unique Users</span></div>
          <div class="stat-item purple"><span class="stat-val">{{ stats.unique_ips }}</span><span class="stat-lbl">Unique IPs</span></div>
        </div>
      }

      <!-- Filters -->
      <div class="filters">
        <div class="search-box">
          <span class="material-icons-round">search</span>
          <input type="text" placeholder="Search user, IP, city..." [(ngModel)]="search" (keyup.enter)="load()" />
        </div>
        <select [(ngModel)]="actionFilter" (change)="load()">
          <option value="">All Actions</option>
          <option value="login">Login</option>
          <option value="failed">Failed</option>
          <option value="logout">Logout</option>
        </select>
        <select [(ngModel)]="successFilter" (change)="load()">
          <option value="">All Results</option>
          <option value="1">Success</option>
          <option value="0">Failed</option>
        </select>
        <input type="date" [(ngModel)]="fromDate" (change)="load()" placeholder="From" />
        <input type="date" [(ngModel)]="toDate" (change)="load()" placeholder="To" />
        <button class="btn-search" (click)="load()"><span class="material-icons-round">search</span></button>
      </div>

      @if (loading) {
        <div class="loading"><span class="material-icons-round spin">progress_activity</span> Loading...</div>
      } @else {
        <div class="results-info">{{ total }} records</div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>User</th>
                <th>Action</th>
                <th>Date &amp; Time</th>
                <th>IP Address</th>
                <th>Location</th>
                <th>ISP</th>
                <th>Browser / Device</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              @for (log of logs; track log.id) {
                <tr [class.failed-row]="!log.success">
                  <td>
                    @if (log.success) {
                      <span class="status-dot green" title="Success"></span>
                    } @else {
                      <span class="status-dot red" title="Failed"></span>
                    }
                  </td>
                  <td>
                    <strong>{{ log.full_name || log.username }}</strong>
                    <br><small class="muted">{{ log.username }}</small>
                  </td>
                  <td><span class="badge" [class]="log.action">{{ log.action }}</span></td>
                  <td class="nowrap">{{ formatDate(log.created_at) }}<br><small class="muted">{{ formatTime(log.created_at) }}</small></td>
                  <td class="mono">{{ log.ip_address || '—' }}</td>
                  <td>
                    @if (log.city || log.country) {
                      <span class="location-text">
                        @if (log.city) { {{ log.city }} }
                        @if (log.region) { , {{ log.region }} }
                        @if (log.country) { <br><small class="muted">{{ log.country }}</small> }
                      </span>
                    } @else {
                      <span class="muted">—</span>
                    }
                  </td>
                  <td><small>{{ log.isp || '—' }}</small></td>
                  <td><small class="ua-text" [title]="log.user_agent">{{ parseUA(log.user_agent) }}</small></td>
                  <td><span class="badge method-badge">{{ log.login_method }}</span></td>
                </tr>
              } @empty {
                <tr><td colspan="9" class="empty-row">No login records found</td></tr>
              }
            </tbody>
          </table>
        </div>

        @if (totalPages > 1) {
          <div class="pagination">
            <button (click)="goPage(page - 1)" [disabled]="page <= 1">Previous</button>
            <span>Page {{ page }} of {{ totalPages }}</span>
            <button (click)="goPage(page + 1)" [disabled]="page >= totalPages">Next</button>
          </div>
        }
      }
    </div>
  `,
  styleUrl: './login-log.component.scss',
})
export class LoginLogComponent implements OnInit {
  logs: any[] = [];
  stats: any = null;
  total = 0; page = 1; limit = 50;
  search = ''; actionFilter = ''; successFilter = '';
  fromDate = ''; toDate = '';
  loading = true;

  get totalPages(): number { return Math.ceil(this.total / this.limit); }

  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.adminService.getLoginLog({
      search: this.search, action: this.actionFilter, success: this.successFilter,
      page: this.page, limit: this.limit, from: this.fromDate, to: this.toDate,
    }).subscribe({
      next: data => {
        this.logs = data.logs;
        this.total = data.total;
        this.stats = data.stats;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  goPage(p: number): void { if (p >= 1 && p <= this.totalPages) { this.page = p; this.load(); } }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatTime(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  parseUA(ua: string): string {
    if (!ua) return '—';
    // Extract browser name simply
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('curl')) return 'cURL';
    return ua.substring(0, 30) + '...';
  }
}
