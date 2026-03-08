import { Component, ChangeDetectionStrategy, inject, signal, afterNextRender } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkoutPlansService, WorkoutPlan, PlanData, PlanDay, PlanExercise } from './workout-plans.service';

@Component({
  selector: 'app-workout-plans',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="page">
      @if (view() === 'list') {
        <div class="page-header">
          <div>
            <h1>Workout Plans</h1>
            <p>Manage your training programs</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="startCreate()">+ Create New</button>
            <button class="btn btn-primary" (click)="onGenerate()" [disabled]="isGenerating()">
              @if (isGenerating()) { Generating... } @else { AI Generate }
            </button>
          </div>
        </div>

        @if (isLoading()) {
          <div class="loading-skeleton">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          </div>
        } @else if (plans().length === 0) {
          <div class="empty-state card">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6.5 6.5h11v11h-11z"/><path d="M3 3h4v4H3z"/><path d="M17 3h4v4h-4z"/><path d="M3 17h4v4H3z"/><path d="M17 17h4v4h-4z"/>
              </svg>
            </div>
            <h2>No workout plans yet</h2>
            <p>Create your own plan or let AI generate one based on your profile.</p>
          </div>
        } @else {
          <div class="plans-list">
            @for (plan of plans(); track plan.id) {
              <div class="plan-card card">
                <div class="plan-header" (click)="toggleExpand(plan.id)">
                  <div>
                    <h3>{{ plan.title }}</h3>
                    <span class="plan-meta">{{ plan.plan_data.days?.length || 0 }} days &middot; {{ formatDate(plan.created_at) }}</span>
                  </div>
                  <span class="expand-icon" [class.expanded]="expandedId() === plan.id">&#9662;</span>
                </div>

                @if (expandedId() === plan.id) {
                  <div class="plan-details">
                    @for (day of plan.plan_data.days; track day.day) {
                      <div class="day-block">
                        <div class="day-label">{{ day.day }} — {{ day.focus }}</div>
                        <div class="exercises-table">
                          @for (ex of day.exercises; track ex.name) {
                            <div class="exercise-row">
                              <span class="ex-name">{{ ex.name }}</span>
                              <span class="ex-detail">{{ ex.sets }} &times; {{ ex.reps }}</span>
                              <span class="ex-rest">{{ ex.rest }} rest</span>
                            </div>
                          }
                        </div>
                      </div>
                    }
                    @if (plan.plan_data.notes) {
                      <div class="plan-notes">{{ plan.plan_data.notes }}</div>
                    }
                    <div class="plan-actions">
                      <button class="btn btn-secondary btn-sm" (click)="startEdit(plan); $event.stopPropagation()">Edit</button>
                      <button class="btn btn-primary btn-sm" (click)="goToLog(plan); $event.stopPropagation()">Log Workout</button>
                      <button class="btn btn-danger btn-sm" (click)="onDelete(plan.id); $event.stopPropagation()">Delete</button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      } @else {
        <!-- EDITOR VIEW -->
        <div class="page-header">
          <div>
            <h1>{{ editingPlanId() ? 'Edit Plan' : 'Create Plan' }}</h1>
            <p>Build your workout plan day by day</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" (click)="cancelEdit()">Cancel</button>
            <button class="btn btn-primary" (click)="savePlan()" [disabled]="isSaving()">
              @if (isSaving()) { Saving... } @else { Save Plan }
            </button>
          </div>
        </div>

        <div class="editor">
          <div class="editor-field">
            <label>Plan Title</label>
            <input type="text" [(ngModel)]="editorTitle" placeholder="e.g. Push/Pull/Legs Split" />
          </div>

          @for (day of editorDays(); track $index; let i = $index) {
            <div class="day-editor card">
              <div class="day-editor-header">
                <div class="day-editor-fields">
                  <input type="text" [(ngModel)]="day.day" placeholder="Day (e.g. Monday)" class="input-day" />
                  <input type="text" [(ngModel)]="day.focus" placeholder="Focus (e.g. Chest & Triceps)" class="input-focus" />
                </div>
                <button class="btn-icon btn-danger-icon" (click)="removeDay(i)" title="Remove day">&times;</button>
              </div>

              <div class="exercises-editor">
                @for (ex of day.exercises; track $index; let j = $index) {
                  <div class="exercise-editor-row">
                    <input type="text" [(ngModel)]="ex.name" placeholder="Exercise name" class="input-ex-name" />
                    <input type="number" [(ngModel)]="ex.sets" placeholder="Sets" class="input-sm" min="1" />
                    <input type="text" [(ngModel)]="ex.reps" placeholder="Reps" class="input-sm" />
                    <input type="text" [(ngModel)]="ex.rest" placeholder="Rest" class="input-sm" />
                    <button class="btn-icon btn-danger-icon" (click)="removeExercise(i, j)" title="Remove">&times;</button>
                  </div>
                }
                <button class="btn btn-link" (click)="addExercise(i)">+ Add Exercise</button>
              </div>
            </div>
          }

          <button class="btn btn-secondary add-day-btn" (click)="addDay()">+ Add Day</button>

          <div class="editor-field">
            <label>Notes (optional)</label>
            <textarea [(ngModel)]="editorNotes" rows="3" placeholder="Any additional notes..."></textarea>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 900px; }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.5rem;

      h1 { font-size: 1.5rem; font-weight: 700; }
      p { color: var(--text-muted); font-size: 0.875rem; margin-top: 0.25rem; }
    }

    .header-actions { display: flex; gap: 0.5rem; }

    .loading-skeleton {
      display: flex; flex-direction: column; gap: 1rem;
    }
    .skeleton-card {
      height: 80px;
      background: var(--bg-card);
      border-radius: var(--radius);
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    .empty-state {
      text-align: center; padding: 3rem 1rem; color: var(--text-muted);
      h2 { color: var(--text-primary); margin: 1rem 0 0.5rem; font-size: 1.125rem; }
    }
    .empty-icon { color: var(--accent); }

    /* Plan list */
    .plans-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .plan-card { padding: 0; overflow: hidden; }

    .plan-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem; cursor: pointer; transition: background var(--transition);
      &:hover { background: var(--bg-secondary); }
      h3 { font-size: 1rem; font-weight: 600; }
    }
    .plan-meta { font-size: 0.8125rem; color: var(--text-muted); }
    .expand-icon { font-size: 0.75rem; color: var(--text-muted); transition: transform 0.2s; }
    .expand-icon.expanded { transform: rotate(180deg); }

    .plan-details { padding: 0 1.25rem 1.25rem; border-top: 1px solid var(--border); }

    .day-block { margin-top: 1rem; }
    .day-label { font-weight: 600; font-size: 0.875rem; color: var(--accent); margin-bottom: 0.5rem; }

    .exercises-table { display: flex; flex-direction: column; gap: 0.25rem; }
    .exercise-row {
      display: flex; gap: 1rem; align-items: center;
      padding: 0.375rem 0.5rem; border-radius: var(--radius-sm);
      font-size: 0.875rem;
      &:hover { background: var(--bg-secondary); }
    }
    .ex-name { flex: 1; font-weight: 500; }
    .ex-detail { color: var(--text-secondary); min-width: 80px; }
    .ex-rest { color: var(--text-muted); font-size: 0.8125rem; min-width: 60px; }

    .plan-notes { margin-top: 1rem; font-size: 0.875rem; color: var(--text-muted); font-style: italic; }

    .plan-actions { display: flex; gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }

    .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }
    .btn-danger { background: var(--danger); color: #fff; border: none; border-radius: var(--radius-sm); cursor: pointer; }
    .btn-danger:hover { opacity: 0.9; }

    /* Editor */
    .editor { display: flex; flex-direction: column; gap: 1rem; }

    .editor-field {
      display: flex; flex-direction: column; gap: 0.5rem;
      label { font-weight: 600; font-size: 0.875rem; color: var(--text-secondary); }
      input, textarea {
        padding: 0.625rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm);
        font-size: 0.9375rem; background: var(--bg-card); outline: none;
        &:focus { border-color: var(--accent); }
      }
    }

    .day-editor { padding: 1rem 1.25rem; }
    .day-editor-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
    .day-editor-fields { display: flex; gap: 0.5rem; flex: 1; }
    .input-day { width: 140px; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.875rem; background: var(--bg-card); }
    .input-focus { flex: 1; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.875rem; background: var(--bg-card); }
    .input-day:focus, .input-focus:focus { border-color: var(--accent); outline: none; }

    .exercises-editor { display: flex; flex-direction: column; gap: 0.5rem; }

    .exercise-editor-row {
      display: flex; gap: 0.5rem; align-items: center;
    }
    .input-ex-name {
      flex: 1; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-sm);
      font-size: 0.875rem; background: var(--bg-card);
      &:focus { border-color: var(--accent); outline: none; }
    }
    .input-sm {
      width: 70px; padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius-sm);
      font-size: 0.875rem; text-align: center; background: var(--bg-card);
      &:focus { border-color: var(--accent); outline: none; }
    }

    .btn-icon {
      width: 28px; height: 28px; border: none; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; font-size: 1.25rem; line-height: 1; background: none;
    }
    .btn-danger-icon { color: var(--danger); &:hover { background: #fee; } }

    .btn-link {
      background: none; border: none; color: var(--accent); font-size: 0.8125rem;
      cursor: pointer; padding: 0.25rem 0; text-align: left;
      &:hover { text-decoration: underline; }
    }

    .add-day-btn { align-self: flex-start; }
  `]
})
export class WorkoutPlansComponent {
  private readonly service = inject(WorkoutPlansService);
  private readonly router = inject(Router);

  readonly plans = signal<WorkoutPlan[]>([]);
  readonly isLoading = signal(true);
  readonly isGenerating = signal(false);
  readonly isSaving = signal(false);
  readonly expandedId = signal<string | null>(null);
  readonly view = signal<'list' | 'editor'>('list');
  readonly editingPlanId = signal<string | null>(null);

  editorTitle = '';
  editorNotes = '';
  readonly editorDays = signal<PlanDay[]>([]);

  constructor() {
    afterNextRender(() => this.loadPlans());
  }

  private loadPlans(): void {
    this.service.getAll().subscribe({
      next: plans => { this.plans.set(plans); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  toggleExpand(id: string): void {
    this.expandedId.update(curr => curr === id ? null : id);
  }

  onGenerate(): void {
    this.isGenerating.set(true);
    this.service.generate().subscribe({
      next: plan => {
        this.plans.update(p => [plan, ...p]);
        this.isGenerating.set(false);
        this.expandedId.set(plan.id);
      },
      error: () => this.isGenerating.set(false),
    });
  }

  onDelete(id: string): void {
    this.service.delete(id).subscribe({
      next: () => this.plans.update(p => p.filter(x => x.id !== id)),
    });
  }

  startCreate(): void {
    this.editingPlanId.set(null);
    this.editorTitle = '';
    this.editorNotes = '';
    this.editorDays.set([this.emptyDay()]);
    this.view.set('editor');
  }

  startEdit(plan: WorkoutPlan): void {
    this.editingPlanId.set(plan.id);
    this.editorTitle = plan.title;
    this.editorNotes = plan.plan_data.notes ?? '';
    this.editorDays.set(JSON.parse(JSON.stringify(plan.plan_data.days ?? [])));
    this.view.set('editor');
  }

  cancelEdit(): void {
    this.view.set('list');
  }

  savePlan(): void {
    const planData: PlanData = {
      days: this.editorDays(),
      notes: this.editorNotes || undefined,
    };
    this.isSaving.set(true);

    const id = this.editingPlanId();
    const obs = id
      ? this.service.update(id, this.editorTitle, planData)
      : this.service.create(this.editorTitle, planData);

    obs.subscribe({
      next: saved => {
        if (id) {
          this.plans.update(p => p.map(x => x.id === id ? saved : x));
        } else {
          this.plans.update(p => [saved, ...p]);
        }
        this.isSaving.set(false);
        this.view.set('list');
        this.expandedId.set(saved.id);
      },
      error: () => this.isSaving.set(false),
    });
  }

  addDay(): void {
    this.editorDays.update(days => [...days, this.emptyDay()]);
  }

  removeDay(index: number): void {
    this.editorDays.update(days => days.filter((_, i) => i !== index));
  }

  addExercise(dayIndex: number): void {
    this.editorDays.update(days => {
      const copy = [...days];
      copy[dayIndex] = {
        ...copy[dayIndex],
        exercises: [...copy[dayIndex].exercises, { name: '', sets: 3, reps: '10', rest: '60s' }],
      };
      return copy;
    });
  }

  removeExercise(dayIndex: number, exIndex: number): void {
    this.editorDays.update(days => {
      const copy = [...days];
      copy[dayIndex] = {
        ...copy[dayIndex],
        exercises: copy[dayIndex].exercises.filter((_, i) => i !== exIndex),
      };
      return copy;
    });
  }

  goToLog(plan: WorkoutPlan): void {
    this.router.navigate(['/workout-log'], { queryParams: { planId: plan.id } });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private emptyDay(): PlanDay {
    return { day: '', focus: '', exercises: [{ name: '', sets: 3, reps: '10', rest: '60s' }] };
  }
}
