import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface LogSet {
  weight_kg: number;
  reps: number;
  completed: boolean;
}

export interface LogExercise {
  name: string;
  sets: LogSet[];
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  workout_plan_id: string;
  plan_day: string;
  logged_date: string;
  exercises: LogExercise[];
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class WorkoutLogService {
  private readonly api = inject(ApiService);

  create(log: {
    workout_plan_id: string;
    plan_day: string;
    logged_date: string;
    exercises: LogExercise[];
  }): Observable<WorkoutLog> {
    return this.api.post<WorkoutLog>('/workout-logs', log);
  }

  getAll(): Observable<WorkoutLog[]> {
    return this.api.get<WorkoutLog[]>('/workout-logs');
  }
}
