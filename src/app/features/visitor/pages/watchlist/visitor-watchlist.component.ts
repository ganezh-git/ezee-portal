import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VisitorService, WatchlistEntry, BlacklistEntry } from '../../services/visitor.service';

@Component({
  selector: 'app-visitor-watchlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header"><button class="back-btn" (click)="goBack()"><span class="material-icons-round">arrow_back</span></button>
      <h1><span class="material-icons-round">visibility</span> Watchlist & Blacklist</h1></div>

      <div class="tabs">
        <button [class.active]="tab==='watchlist'" (click)="tab='watchlist'">Watchlist ({{ watchlist.length }})</button>
        <button [class.active]="tab==='blacklist'" (click)="tab='blacklist'">Blacklist ({{ blacklist.length }})</button>
      </div>

      <!-- Watchlist -->
      <div *ngIf="tab==='watchlist'">
        <div class="add-form">
          <input placeholder="Name *" [(ngModel)]="wf.visitor_name">
          <input placeholder="Company" [(ngModel)]="wf.company">
          <input placeholder="Phone" [(ngModel)]="wf.phone">
          <input placeholder="Reason *" [(ngModel)]="wf.reason">
          <select [(ngModel)]="wf.priority"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
          <button class="btn-add" (click)="addWatch()" [disabled]="!wf.visitor_name || !wf.reason">Add</button>
        </div>
        <table class="data-table" *ngIf="watchlist.length">
          <thead><tr><th>Name</th><th>Company</th><th>Phone</th><th>Reason</th><th>Priority</th><th>Added</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let w of watchlist">
              <td>{{ w.visitor_name }}</td><td>{{ w.company || '—' }}</td><td>{{ w.phone || '—' }}</td>
              <td>{{ w.reason }}</td>
              <td><span class="priority" [attr.data-p]="w.priority">{{ w.priority }}</span></td>
              <td>{{ w.added_at | date:'dd MMM yyyy' }}</td>
              <td><button class="btn-del" (click)="removeWatch(w.id)">✕</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Blacklist -->
      <div *ngIf="tab==='blacklist'">
        <div class="add-form">
          <input placeholder="Name *" [(ngModel)]="bf.visitor_name">
          <input placeholder="Company" [(ngModel)]="bf.company">
          <input placeholder="Phone" [(ngModel)]="bf.phone">
          <input placeholder="ID Number" [(ngModel)]="bf.id_number">
          <input placeholder="Reason *" [(ngModel)]="bf.reason">
          <select [(ngModel)]="bf.severity"><option value="high">High</option><option value="critical">Critical</option></select>
          <button class="btn-add red" (click)="addBlack()" [disabled]="!bf.visitor_name || !bf.reason">Add</button>
        </div>
        <table class="data-table" *ngIf="blacklist.length">
          <thead><tr><th>Name</th><th>Company</th><th>Phone</th><th>ID</th><th>Reason</th><th>Severity</th><th>Added</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let b of blacklist">
              <td>{{ b.visitor_name }}</td><td>{{ b.company || '—' }}</td><td>{{ b.phone || '—' }}</td>
              <td>{{ b.id_number || '—' }}</td><td>{{ b.reason }}</td>
              <td><span class="severity" [attr.data-s]="b.severity">{{ b.severity }}</span></td>
              <td>{{ b.blacklisted_at | date:'dd MMM yyyy' }}</td>
              <td><button class="btn-del" (click)="removeBlack(b.id)">✕</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 24px 28px; }
    h1 { font-size: 1.4rem; font-weight: 700; display: flex; align-items: center; gap: 10px; margin: 0;
      .material-icons-round { color: #8b5cf6; }
    }
    .tabs { display: flex; gap: 4px; margin-bottom: 20px;
      button { padding: 9px 20px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer; font-size: .85rem; font-weight: 500;
        &.active { background: #8b5cf6; color: #fff; border-color: #8b5cf6; }
      }
    }
    .add-form { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;
      input, select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: .82rem; }
    }
    .btn-add { padding: 8px 18px; background: #8b5cf6; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: .82rem;
      &:hover { background: #7c3aed; } &:disabled { opacity: .5; }
      &.red { background: #ef4444; &:hover { background: #dc2626; } }
    }
    .data-table { width: 100%; border-collapse: collapse; font-size: .82rem; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.06);
      th { text-align: left; padding: 8px 10px; color: #64748b; font-weight: 600; border-bottom: 2px solid #f1f5f9; font-size: .72rem; text-transform: uppercase; }
      td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
    }
    .priority { padding: 3px 10px; border-radius: 20px; font-size: .72rem; font-weight: 600; text-transform: capitalize;
      &[data-p="low"] { background: #f0fdf4; color: #166534; }
      &[data-p="medium"] { background: #fef3c7; color: #92400e; }
      &[data-p="high"] { background: #fef2f2; color: #991b1b; }
    }
    .severity { padding: 3px 10px; border-radius: 20px; font-size: .72rem; font-weight: 600; text-transform: capitalize;
      &[data-s="high"] { background: #fef2f2; color: #991b1b; }
      &[data-s="critical"] { background: #450a0a; color: #fecaca; }
    }
    .btn-del { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1rem; font-weight: 700; &:hover { color: #dc2626; } }
    .page-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
    .back-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover { background: #f1f5f9; } .material-icons-round { font-size: 20px; color: #64748b; } }
  `]
})
export class VisitorWatchlistComponent implements OnInit {
  tab = 'watchlist';
  watchlist: WatchlistEntry[] = [];
  blacklist: BlacklistEntry[] = [];
  wf: any = { priority: 'medium' };
  bf: any = { severity: 'high' };

  constructor(private svc: VisitorService, private router: Router) {}

  ngOnInit() {
    this.svc.getWatchlist().subscribe(w => this.watchlist = w);
    this.svc.getBlacklist().subscribe(b => this.blacklist = b);
  }

  goBack() { this.router.navigate(['/visitor/dashboard']); }

  addWatch() {
    this.svc.addToWatchlist(this.wf).subscribe(() => {
      this.wf = { priority: 'medium' };
      this.svc.getWatchlist().subscribe(w => this.watchlist = w);
    });
  }

  removeWatch(id: number) {
    this.svc.removeFromWatchlist(id).subscribe(() => this.svc.getWatchlist().subscribe(w => this.watchlist = w));
  }

  addBlack() {
    this.svc.addToBlacklist(this.bf).subscribe(() => {
      this.bf = { severity: 'high' };
      this.svc.getBlacklist().subscribe(b => this.blacklist = b);
    });
  }

  removeBlack(id: number) {
    this.svc.removeFromBlacklist(id).subscribe(() => this.svc.getBlacklist().subscribe(b => this.blacklist = b));
  }
}
