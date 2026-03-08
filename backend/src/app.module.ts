import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { WorkoutPlansModule } from './workout-plans/workout-plans.module';
import { WorkoutLogsModule } from './workout-logs/workout-logs.module';
import { SupabaseService } from './shared/supabase.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    ChatModule,
    WorkoutPlansModule,
    WorkoutLogsModule,
  ],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class AppModule {}
