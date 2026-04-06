import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LibraryService, LibStats } from '../../services/library.service';

@Component({
  selector: 'app-library-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-left">
          <span class="material-icons-round header-icon">local_library</span>
          <div><h1>Library Management</h1><p>Dashboard &amp; Overview</p></div>
        </div>
        <div class="header-actions">
          <a routerLink="../circulation" class="btn-primary"><span class="material-icons-round">swap_horiz</span> Issue / Return</a>
          <a routerLink="../books" [queryParams]="{action:'new'}" class="btn-outline"><span class="material-icons-round">add</span> Add Book</a>
        </div>
      </div>

      @if (loading) {
        <div class="loading"><span class="material-icons-round spin">progress_activity</span> Loading dashboard...</div>
      } @else {
        <div class="stat-grid">
          <a routerLink="../books" class="stat-card blue">
            <div class="stat-icon"><span class="material-icons-round">menu_book</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.totalTitles }}</span><span class="stat-lbl">Total Titles</span></div>
          </a>
          <div class="stat-card teal">
            <div class="stat-icon"><span class="material-icons-round">inventory_2</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.totalCopies }}</span><span class="stat-lbl">Total Copies</span><small class="stat-sub">{{ stats?.availableCopies }} available</small></div>
          </div>
          <a routerLink="../members" class="stat-card green">
            <div class="stat-icon"><span class="material-icons-round">people</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.totalMembers }}</span><span class="stat-lbl">Active Members</span></div>
          </a>
          <a routerLink="../circulation" class="stat-card amber">
            <div class="stat-icon"><span class="material-icons-round">book</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.activeIssues }}</span><span class="stat-lbl">Books Issued</span></div>
          </a>
          <a routerLink="../circulation" [queryParams]="{filter:'overdue'}" class="stat-card red">
            <div class="stat-icon"><span class="material-icons-round">warning</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.overdueBooks }}</span><span class="stat-lbl">Overdue</span></div>
          </a>
          <div class="stat-card purple">
            <div class="stat-icon"><span class="material-icons-round">today</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.todayIssued }}/{{ stats?.todayReturned }}</span><span class="stat-lbl">Today Issued/Returned</span></div>
          </div>
          <div class="stat-card orange">
            <div class="stat-icon"><span class="material-icons-round">receipt_long</span></div>
            <div class="stat-info"><span class="stat-val">₹{{ stats?.pendingFines }}</span><span class="stat-lbl">Pending Fines</span></div>
          </div>
          <a routerLink="../digital" class="stat-card indigo">
            <div class="stat-icon"><span class="material-icons-round">cloud_download</span></div>
            <div class="stat-info"><span class="stat-val">{{ stats?.digitalDocs }}</span><span class="stat-lbl">Digital Documents</span></div>
          </a>
        </div>

        <div class="grid-2">
          <!-- Recent Issues -->
          <div class="card">
            <div class="card-header">
              <h3><span class="material-icons-round">history</span> Recent Issues</h3>
              <a routerLink="../circulation" class="link">View All</a>
            </div>
            @if (stats?.recentIssues?.length) {
              <div class="table-wrap">
                <table>
                  <thead><tr><th>Issue #</th><th>Book</th><th>Member</th><th>Date</th><th>Due</th><th>Status</th></tr></thead>
                  <tbody>
                    @for (i of stats!.recentIssues; track i.id) {
                      <tr>
                        <td class="mono">{{ i.issue_no }}</td>
                        <td><strong>{{ i.title }}</strong><br><small class="muted">{{ i.authors }}</small></td>
                        <td>{{ i.member_name }}<br><small class="muted">{{ i.member_no }}</small></td>
                        <td>{{ formatDate(i.issue_date) }}</td>
                        <td [class.overdue]="isOverdue(i)">{{ formatDate(i.due_date) }}</td>
                        <td><span class="badge" [class]="i.status">{{ i.status }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <div class="empty"><span class="material-icons-round">library_books</span><p>No recent issues</p></div>
            }
          </div>

          <!-- Popular Books -->
          <div class="card">
            <div class="card-header">
              <h3><span class="material-icons-round">trending_up</span> Most Popular Books</h3>
            </div>
            @if (stats?.popularBooks?.length) {
              <div class="popular-list">
                @for (b of stats!.popularBooks; track b.id; let idx = $index) {
                  <div class="popular-item">
                    <span class="rank">#{{ idx + 1 }}</span>
                    @if (b.cover_url) {
                      <img [src]="b.cover_url" [alt]="b.title" class="book-thumb" />
                    } @else {
                      <div class="book-thumb placeholder"><span class="material-icons-round">menu_book</span></div>
                    }
                    <div class="popular-info">
                      <strong>{{ b.title }}</strong>
                      <small>{{ b.authors }}</small>
                    </div>
                    <span class="issue-count">{{ b.issue_count }} issues</span>
                  </div>
                }
              </div>
            } @else {
              <div class="empty"><span class="material-icons-round">auto_stories</span><p>No data yet</p></div>
            }
          </div>
        </div>

        <!-- Category Breakdown -->
        @if (stats?.categoryBreakdown?.length) {
          <div class="card">
            <div class="card-header"><h3><span class="material-icons-round">category</span> Books by Category</h3></div>
            <div class="category-bars">
              @for (c of stats!.categoryBreakdown; track c.category) {
                <div class="cat-row">
                  <span class="cat-name">{{ c.category || 'Uncategorized' }}</span>
                  <div class="cat-bar-wrap"><div class="cat-bar" [style.width.%]="catPercent(c.count)"></div></div>
                  <span class="cat-count">{{ c.count }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Member Type Breakdown -->
        @if (stats?.memberTypeBreakdown?.length) {
          <div class="card">
            <div class="card-header"><h3><span class="material-icons-round">groups</span> Members by Type</h3></div>
            <div class="member-chips">
              @for (m of stats!.memberTypeBreakdown; track m.member_type) {
                <div class="member-chip">
                  <span class="chip-type">{{ m.member_type }}</span>
                  <span class="chip-count">{{ m.count }}</span>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styleUrl: './library-dashboard.component.scss',
})
export class LibraryDashboardComponent implements OnInit {
  stats: LibStats | null = null;
  loading = true;
  private maxCatCount = 1;

  constructor(private svc: LibraryService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.svc.getStats().subscribe({
      next: s => {
        this.stats = s;
        this.maxCatCount = Math.max(...(s.categoryBreakdown?.map(c => c.count) || [1]), 1);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
    });
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  isOverdue(i: any): boolean {
    return i.status === 'issued' && new Date(i.due_date) < new Date();
  }

  catPercent(count: number): number {
    return (count / this.maxCatCount) * 100;
  }
}
