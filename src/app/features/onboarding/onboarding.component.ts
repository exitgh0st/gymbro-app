import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="onboarding-page">
      <div class="onboarding-card card">
        <div class="onboarding-header">
          <h1>Welcome to GymBro</h1>
          <p>Let's set up your profile so your AI trainer can give you personalized advice.</p>
        </div>

        @if (error()) {
          <div class="onboarding-error">{{ error() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="onboarding-form">
          <div class="form-group">
            <label for="name">Name</label>
            <input id="name" type="text" formControlName="name" placeholder="Your name" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="age">Age</label>
              <input id="age" type="number" formControlName="age" placeholder="25" />
            </div>
            <div class="form-group">
              <label for="gender">Gender</label>
              <select id="gender" formControlName="gender">
                <option value="" disabled>Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="height_cm">Height (cm)</label>
              <input id="height_cm" type="number" formControlName="height_cm" placeholder="175" />
            </div>
            <div class="form-group">
              <label for="weight_kg">Weight (kg)</label>
              <input id="weight_kg" type="number" formControlName="weight_kg" placeholder="70" />
            </div>
          </div>

          <div class="form-group">
            <label for="fitness_goal">Fitness Goal</label>
            <select id="fitness_goal" formControlName="fitness_goal">
              <option value="" disabled>Select your goal</option>
              <option value="lose_weight">Lose Weight</option>
              <option value="build_muscle">Build Muscle</option>
              <option value="improve_endurance">Improve Endurance</option>
              <option value="increase_strength">Increase Strength</option>
              <option value="general_fitness">General Fitness</option>
              <option value="improve_flexibility">Improve Flexibility</option>
            </select>
          </div>

          <div class="form-group">
            <label for="activity_level">Activity Level</label>
            <select id="activity_level" formControlName="activity_level">
              <option value="" disabled>Select your level</option>
              <option value="sedentary">Sedentary (little or no exercise)</option>
              <option value="lightly_active">Lightly Active (1-3 days/week)</option>
              <option value="moderately_active">Moderately Active (3-5 days/week)</option>
              <option value="very_active">Very Active (6-7 days/week)</option>
              <option value="extra_active">Extra Active (athlete / physical job)</option>
            </select>
          </div>

          <button
            type="submit"
            class="btn btn-primary onboarding-submit"
            [disabled]="loading() || form.invalid"
          >
            @if (loading()) {
              <span class="spinner"></span>
            }
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .onboarding-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      background: var(--bg-secondary);
    }

    .onboarding-card {
      width: 100%;
      max-width: 520px;
      padding: 2.5rem;
    }

    .onboarding-header {
      margin-bottom: 2rem;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
      }

      p {
        color: var(--text-muted);
        margin-top: 0.5rem;
        font-size: 0.9375rem;
      }
    }

    .onboarding-error {
      background: #fff5f5;
      color: var(--danger);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .onboarding-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;

      .form-group {
        flex: 1;
      }
    }

    .onboarding-submit {
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
export class OnboardingComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    age: new FormControl<number | null>(null, [Validators.required, Validators.min(1), Validators.max(119)]),
    gender: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    height_cm: new FormControl<number | null>(null, [Validators.required, Validators.min(50), Validators.max(300)]),
    weight_kg: new FormControl<number | null>(null, [Validators.required, Validators.min(20), Validators.max(500)]),
    fitness_goal: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    activity_level: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    this.api.put('/users/profile', this.form.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.auth.markProfileComplete();
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to save profile. Please try again.');
      },
    });
  }
}
