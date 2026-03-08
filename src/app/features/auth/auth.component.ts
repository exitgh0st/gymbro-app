import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="auth-header">
          <span class="auth-logo">GB</span>
          <h1>GymBro</h1>
          <p>Your AI-powered personal trainer</p>
        </div>

        <div class="auth-tabs">
          <button
            class="auth-tab"
            [class.active]="mode() === 'login'"
            (click)="mode.set('login')"
          >Sign In</button>
          <button
            class="auth-tab"
            [class.active]="mode() === 'signup'"
            (click)="mode.set('signup')"
          >Sign Up</button>
        </div>

        @if (error()) {
          <div class="auth-error">{{ error() }}</div>
        }

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Your password"
              required
              minlength="6"
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary auth-submit"
            [disabled]="loading()"
          >
            @if (loading()) {
              <span class="spinner"></span>
            }
            {{ mode() === 'login' ? 'Sign In' : 'Create Account' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: var(--bg-secondary);
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 2.5rem;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;

      h1 {
        font-size: 1.75rem;
        font-weight: 700;
        margin-top: 0.75rem;
      }

      p {
        color: var(--text-muted);
        margin-top: 0.25rem;
        font-size: 0.9375rem;
      }
    }

    .auth-logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: var(--accent);
      color: #fff;
      border-radius: var(--radius);
      font-weight: 700;
      font-size: 1.125rem;
    }

    .auth-tabs {
      display: flex;
      gap: 0;
      margin-bottom: 1.5rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      padding: 0.25rem;
    }

    .auth-tab {
      flex: 1;
      padding: 0.5rem;
      border: none;
      background: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-muted);
      transition: all var(--transition);

      &.active {
        background: var(--bg-primary);
        color: var(--text-primary);
        box-shadow: var(--shadow);
      }
    }

    .auth-error {
      background: #fff5f5;
      color: var(--danger);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .auth-submit {
      width: 100%;
      margin-top: 0.5rem;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AuthComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = signal<'login' | 'signup'>('login');
  readonly loading = signal(false);
  readonly error = signal('');

  email = '';
  password = '';

  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.error.set('');

    const action = this.mode() === 'login'
      ? this.auth.login(this.email, this.password)
      : this.auth.signup(this.email, this.password);

    action.subscribe(success => {
      this.loading.set(false);
      if (success) {
        const target = this.auth.hasProfile() ? '/dashboard' : '/onboarding';
        this.router.navigate([target]);
      } else {
        this.error.set(
          this.mode() === 'login'
            ? 'Invalid email or password. Please try again.'
            : 'Could not create account. The email may already be in use.'
        );
      }
    });
  }
}
