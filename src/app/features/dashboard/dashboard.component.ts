import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';

interface UserProfile {
  id: string;
  name: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  gender: string;
  fitness_goal: string;
  activity_level: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="dashboard">
      @if (profileResource.isLoading()) {
        <div class="loading-skeleton">
          <div class="skeleton-card"></div>
          <div class="skeleton-row">
            <div class="skeleton-stat"></div>
            <div class="skeleton-stat"></div>
            <div class="skeleton-stat"></div>
          </div>
        </div>
      } @else if (profile(); as p) {
        <div class="dashboard-welcome card">
          <div class="welcome-text">
            <h1>Hey, {{ p.name }}!</h1>
            <p>Ready to crush your goals today?</p>
          </div>
          <a routerLink="/chat" class="btn btn-primary">Chat with GymBro</a>
        </div>

        <div class="stats-grid">
          <div class="stat-card card">
            <div class="stat-label">Goal</div>
            <div class="stat-value">{{ formatGoal(p.fitness_goal) }}</div>
          </div>
          <div class="stat-card card">
            <div class="stat-label">Activity</div>
            <div class="stat-value">{{ formatActivity(p.activity_level) }}</div>
          </div>
          <div class="stat-card card">
            <div class="stat-label">BMI</div>
            <div class="stat-value">{{ bmi() }}</div>
            <div class="stat-sub">{{ bmiCategory() }}</div>
          </div>
          <div class="stat-card card">
            <div class="stat-label">Weight</div>
            <div class="stat-value">{{ p.weight_kg }} kg</div>
            <div class="stat-sub">{{ p.height_cm }} cm tall</div>
          </div>
        </div>

        <div class="quick-actions">
          <h2>Quick Actions</h2>
          <div class="actions-grid">
            <a routerLink="/chat" class="action-card card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Ask your trainer</span>
            </a>
          </div>
        </div>
      } @else {
        <div class="card">
          <p>Could not load your profile. Please try refreshing.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 900px;
    }

    .loading-skeleton {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .skeleton-card, .skeleton-stat {
      background: var(--bg-card);
      border-radius: var(--radius);
      animation: pulse 1.5s ease-in-out infinite;
    }

    .skeleton-card {
      height: 120px;
    }

    .skeleton-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .skeleton-stat {
      height: 100px;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .dashboard-welcome {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
      }

      p {
        color: var(--text-muted);
        margin-top: 0.25rem;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      .stat-label {
        font-size: 0.8125rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
      }

      .stat-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .stat-sub {
        font-size: 0.8125rem;
        color: var(--text-muted);
        margin-top: 0.25rem;
      }
    }

    .quick-actions {
      h2 {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 1rem;
      }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: var(--text-primary);
      transition: all var(--transition);

      svg {
        color: var(--accent);
      }

      &:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
      }
    }
  `]
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);

  readonly profileResource = httpResource<UserProfile>(() => '/api/users/profile');

  readonly profile = computed(() => this.profileResource.value());

  readonly bmi = computed(() => {
    const p = this.profile();
    if (!p) return '--';
    const heightM = p.height_cm / 100;
    return (p.weight_kg / (heightM * heightM)).toFixed(1);
  });

  readonly bmiCategory = computed(() => {
    const val = parseFloat(this.bmi());
    if (isNaN(val)) return '';
    if (val < 18.5) return 'Underweight';
    if (val < 25) return 'Normal';
    if (val < 30) return 'Overweight';
    return 'Obese';
  });

  formatGoal(goal: string): string {
    return goal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  formatActivity(level: string): string {
    return level.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
