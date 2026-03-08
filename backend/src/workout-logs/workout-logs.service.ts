import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../shared/supabase.service';
import { CreateLogDto } from './dto/create-log.dto';

@Injectable()
export class WorkoutLogsService {
  constructor(private readonly supabase: SupabaseService) {}

  async createLog(userId: string, dto: CreateLogDto) {
    const { data, error } = await this.supabase.client
      .from('workout_logs')
      .insert({
        user_id: userId,
        workout_plan_id: dto.workout_plan_id,
        plan_day: dto.plan_day,
        logged_date: dto.logged_date,
        exercises: dto.exercises,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getLogs(userId: string) {
    const { data } = await this.supabase.client
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_date', { ascending: false })
      .limit(20);

    return data ?? [];
  }
}
