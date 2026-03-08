import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { NavComponent } from './shared/components/nav/nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NavComponent],
  template: `
    <div class="layout" [class.with-nav]="showNav()">
      @if (showNav()) {
        <app-nav />
      }
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .layout {
      min-height: 100vh;
    }

    .layout.with-nav .main-content {
      margin-left: var(--nav-width);
    }

    .main-content {
      padding: 2rem;
    }

    @media (max-width: 768px) {
      .layout.with-nav .main-content {
        margin-left: 0;
        padding-bottom: calc(4.5rem + env(safe-area-inset-bottom));
      }

      .main-content {
        padding: 1rem;
      }
    }
  `]
})
export class App {
  private readonly auth = inject(AuthService);

  readonly showNav = computed(() => this.auth.isLoggedIn() && this.auth.hasProfile());
}
