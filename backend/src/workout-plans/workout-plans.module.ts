import { Module } from '@nestjs/common';
import { WorkoutPlansController } from './workout-plans.controller';
import { WorkoutPlansService } from './workout-plans.service';
import { SupabaseService } from '../shared/supabase.service';

@Module({
  controllers: [WorkoutPlansController],
  providers: [WorkoutPlansService, SupabaseService],
})
export class WorkoutPlansModule {}
