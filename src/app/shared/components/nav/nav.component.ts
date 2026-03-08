import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="nav">
      <div class="nav-brand">
        <span class="nav-logo">GB</span>
        <span class="nav-title">GymBro</span>
      </div>

      <div class="nav-links">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Dashboard
        </a>
        <a routerLink="/chat" routerLinkActive="active" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          AI Trainer
        </a>
        <a routerLink="/workout-plans" routerLinkActive="active" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2v20"/><path d="M18 2v20"/><rect x="2" y="8" width="20" height="8" rx="1"/>
          </svg>
          Workout Plans
        </a>
        <a routerLink="/workout-log" routerLinkActive="active" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          Log Workout
        </a>
      </div>

      <div class="nav-footer">
        <div class="nav-user">
          <div class="nav-avatar">{{ userInitial() }}</div>
          <span class="nav-email">{{ userEmail() }}</span>
        </div>
        <button class="nav-signout" (click)="onSignOut()">Sign Out</button>
      </div>
    </nav>
  `,
  styles: [`
    .nav {
      width: var(--nav-width);
      height: 100vh;
      background: var(--bg-primary);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem;
      position: fixed;
      left: 0;
      top: 0;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0 0.5rem;
      margin-bottom: 2rem;
    }

    .nav-logo {
      width: 36px;
      height: 36px;
      background: var(--accent);
      color: #fff;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
    }

    .nav-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .nav-links {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 0.9375rem;
      font-weight: 500;
      text-decoration: none;
      transition: all var(--transition);

      &:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }

      &.active {
        background: var(--accent-light);
        color: var(--accent);
      }
    }

    .nav-footer {
      border-top: 1px solid var(--border);
      padding-top: 1rem;
    }

    .nav-user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .nav-avatar {
      width: 32px;
      height: 32px;
      background: var(--accent-light);
      color: var(--accent);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .nav-email {
      font-size: 0.8125rem;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .nav-signout {
      width: 100%;
      padding: 0.5rem;
      background: none;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 0.8125rem;
      transition: all var(--transition);

      &:hover {
        background: var(--danger);
        color: #fff;
        border-color: var(--danger);
      }
    }
  `]
})
export class NavComponent {
  private readonly auth = inject(AuthService);

  readonly userEmail = computed(() => this.auth.user()?.email ?? '');
  readonly userInitial = computed(() => {
    const email = this.userEmail();
    return email ? email[0].toUpperCase() : '?';
  });

  onSignOut(): void {
    this.auth.logout();
  }
}
