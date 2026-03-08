import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { WorkoutPlansService } from '../workout-plans/workout-plans.service';
import { SupabaseService } from '../shared/supabase.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, WorkoutPlansService, SupabaseService],
})
export class ChatModule {}
