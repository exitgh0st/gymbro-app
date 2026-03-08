import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface PlanExercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
}

export interface PlanDay {
  day: string;
  focus: string;
  exercises: PlanExercise[];
}

export interface PlanData {
  days: PlanDay[];
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  title: string;
  plan_data: PlanData;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class WorkoutPlansService {
  private readonly api = inject(ApiService);

  getAll(): Observable<WorkoutPlan[]> {
    return this.api.get<WorkoutPlan[]>('/workout-plans');
  }

  getOne(id: string): Observable<WorkoutPlan> {
    return this.api.get<WorkoutPlan>(`/workout-plans/${id}`);
  }

  generate(preferences?: string): Observable<WorkoutPlan> {
    return this.api.post<WorkoutPlan>('/workout-plans/generate', { preferences });
  }

  create(title: string, plan_data: PlanData): Observable<WorkoutPlan> {
    return this.api.post<WorkoutPlan>('/workout-plans', { title, plan_data });
  }

  update(id: string, title: string, plan_data: PlanData): Observable<WorkoutPlan> {
    return this.api.put<WorkoutPlan>(`/workout-plans/${id}`, { title, plan_data });
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/workout-plans/${id}`);
  }
}
