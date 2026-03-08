import { Component, ChangeDetectionStrategy, inject, signal, afterNextRender } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkoutPlansService, WorkoutPlan, PlanDay } from '../workout-plans/workout-plans.service';
import { WorkoutLogService, LogExercise } from './workout-log.service';

@Component({
  selector: 'app-workout-log',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Log Workout</h1>
          <p>Record your sets for today's session</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="goBack()">Back</button>
          <button class="btn btn-primary" (click)="saveSession()" [disabled]="isSaving()">
            @if (isSaving()) { Saving... } @else { Save Session }
          </button>
        </div>
      </div>

      @if (isLoading()) {
        <div class="loading-skeleton">
          <div class="skeleton-card"></div>
        </div>
      } @else if (!plan()) {
        <div class="card empty-state">
          <p>Plan not found. Go back and select a plan to log.</p>
        </div>
      } @else {
        <!-- Day selector -->
        <div class="day-tabs">
          @for (day of plan()!.plan_data.days; track day.day; let i = $index) {
            <button
              class="day-tab"
              [class.active]="selectedDayIndex() === i"
              (click)="selectDay(i)"
            >
              <span class="tab-day">{{ day.day }}</span>
              <span class="tab-focus">{{ day.focus }}</span>
            </button>
          }
        </div>

        <!-- Exercise log -->
        @if (selectedDay(); as day) {
          <div class="log-exercises">
            @for (ex of exercises(); track $index; let ei = $index) {
              <div class="exercise-block card">
                <div class="exercise-name">{{ ex.name }}</div>
                <div class="sets-header">
                  <span class="set-col">#</span>
                  <span class="weight-col">Weight (kg)</span>
                  <span class="reps-col">Reps</span>
                  <span class="done-col">Done</span>
                  <span class="remove-col"></span>
                </div>
                @for (set of ex.sets; track $index; let si = $index) {
                  <div class="set-row" [class.completed]="set.completed">
                    <span class="set-col set-num">{{ si + 1 }}</span>
                    <input type="number" class="weight-col" [(ngModel)]="set.weight_kg" min="0" step="0.5" />
                    <input type="number" class="reps-col" [(ngModel)]="set.reps" min="0" />
                    <label class="done-col checkbox-wrap">
                      <input type="checkbox" [(ngModel)]="set.completed" />
                      <span class="checkmark"></span>
                    </label>
                    <button class="remove-col btn-icon btn-danger-icon" (click)="removeSet(ei, si)">&times;</button>
                  </div>
                }
                <button class="btn btn-link" (click)="addSet(ei)">+ Add Set</button>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { max-width: 800px; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem;
      h1 { font-size: 1.5rem; font-weight: 700; }
      p { color: var(--text-muted); font-size: 0.875rem; margin-top: 0.25rem; }
    }
    .header-actions { display: flex; gap: 0.5rem; }

    .loading-skeleton .skeleton-card {
      height: 120px; background: var(--bg-card); border-radius: var(--radius);
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    .empty-state { text-align: center; padding: 2rem; color: var(--text-muted); }

    /* Day tabs */
    .day-tabs {
      display: flex; gap: 0.5rem; overflow-x: auto; margin-bottom: 1.5rem;
      padding-bottom: 0.25rem;
    }
    .day-tab {
      display: flex; flex-direction: column; align-items: flex-start;
      padding: 0.625rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-sm);
      background: var(--bg-card); cursor: pointer; transition: all var(--transition);
      white-space: nowrap; min-width: 100px;
      &:hover { border-color: var(--accent); }
      &.active { border-color: var(--accent); background: var(--accent-light); }
    }
    .tab-day { font-weight: 600; font-size: 0.875rem; }
    .tab-focus { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.125rem; }
    .day-tab.active .tab-day { color: var(--accent); }

    /* Exercise blocks */
    .log-exercises { display: flex; flex-direction: column; gap: 1rem; }

    .exercise-block { padding: 1rem 1.25rem; }
    .exercise-name { font-weight: 600; font-size: 1rem; margin-bottom: 0.75rem; }

    .sets-header, .set-row {
      display: flex; align-items: center; gap: 0.5rem;
    }
    .sets-header {
      font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;
      letter-spacing: 0.05em; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border);
      margin-bottom: 0.5rem;
    }

    .set-row {
      padding: 0.375rem 0; transition: background var(--transition);
      &.completed { opacity: 0.6; }
    }

    .set-col { width: 32px; text-align: center; }
    .set-num { font-weight: 600; color: var(--text-muted); font-size: 0.875rem; }
    .weight-col { flex: 1; }
    .reps-col { width: 80px; }
    input.weight-col, input.reps-col {
      padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-sm);
      font-size: 0.875rem; text-align: center; background: var(--bg-card); width: 100%;
      &:focus { border-color: var(--accent); outline: none; }
    }
    .done-col { width: 40px; display: flex; justify-content: center; }
    .remove-col { width: 28px; }

    .checkbox-wrap {
      position: relative; cursor: pointer;
      input { position: absolute; opacity: 0; width: 0; height: 0; }
    }
    .checkmark {
      display: inline-block; width: 20px; height: 20px; border: 2px solid var(--border);
      border-radius: 4px; transition: all var(--transition);
    }
    input:checked ~ .checkmark {
      background: var(--accent); border-color: var(--accent);
      &::after {
        content: ''; display: block; width: 5px; height: 10px;
        border: solid #fff; border-width: 0 2px 2px 0;
        transform: rotate(45deg); margin: 2px auto;
      }
    }

    .btn-icon {
      width: 28px; height: 28px; border: none; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 1.25rem; line-height: 1; background: none;
    }
    .btn-danger-icon { color: var(--danger); &:hover { background: #fee; } }
    .btn-link {
      background: none; border: none; color: var(--accent); font-size: 0.8125rem;
      cursor: pointer; padding: 0.25rem 0; text-align: left; margin-top: 0.5rem;
      &:hover { text-decoration: underline; }
    }
  `]
})
export class WorkoutLogComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly plansService = inject(WorkoutPlansService);
  private readonly logService = inject(WorkoutLogService);

  readonly plan = signal<WorkoutPlan | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly selectedDayIndex = signal(0);
  readonly selectedDay = signal<PlanDay | null>(null);
  readonly exercises = signal<LogExercise[]>([]);

  constructor() {
    afterNextRender(() => {
      const planId = this.route.snapshot.queryParamMap.get('planId');
      if (planId) {
        this.plansService.getOne(planId).subscribe({
          next: plan => {
            this.plan.set(plan);
            this.isLoading.set(false);
            if (plan.plan_data.days?.length) {
              this.selectDay(0);
            }
          },
          error: () => this.isLoading.set(false),
        });
      } else {
        this.isLoading.set(false);
      }
    });
  }

  selectDay(index: number): void {
    const p = this.plan();
    if (!p) return;
    const day = p.plan_data.days[index];
    this.selectedDayIndex.set(index);
    this.selectedDay.set(day);
    this.exercises.set(
      day.exercises.map(ex => ({
        name: ex.name,
        sets: Array.from({ length: ex.sets }, () => ({ weight_kg: 0, reps: 0, completed: false })),
      }))
    );
  }

  addSet(exerciseIndex: number): void {
    this.exercises.update(exs => {
      const copy = [...exs];
      copy[exerciseIndex] = {
        ...copy[exerciseIndex],
        sets: [...copy[exerciseIndex].sets, { weight_kg: 0, reps: 0, completed: false }],
      };
      return copy;
    });
  }

  removeSet(exerciseIndex: number, setIndex: number): void {
    this.exercises.update(exs => {
      const copy = [...exs];
      copy[exerciseIndex] = {
        ...copy[exerciseIndex],
        sets: copy[exerciseIndex].sets.filter((_, i) => i !== setIndex),
      };
      return copy;
    });
  }

  saveSession(): void {
    const p = this.plan();
    const day = this.selectedDay();
    if (!p || !day) return;

    this.isSaving.set(true);
    this.logService.create({
      workout_plan_id: p.id,
      plan_day: day.day,
      logged_date: new Date().toISOString().split('T')[0],
      exercises: this.exercises(),
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/workout-plans']);
      },
      error: () => this.isSaving.set(false),
    });
  }

  goBack(): void {
    this.router.navigate(['/workout-plans']);
  }
}
