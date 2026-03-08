import { Module } from '@nestjs/common';
import { WorkoutLogsController } from './workout-logs.controller';
import { WorkoutLogsService } from './workout-logs.service';
import { SupabaseService } from '../shared/supabase.service';

@Module({
  controllers: [WorkoutLogsController],
  providers: [WorkoutLogsService, SupabaseService],
})
export class WorkoutLogsModule {}
