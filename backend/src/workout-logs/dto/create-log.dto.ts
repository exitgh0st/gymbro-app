import { IsString, IsNotEmpty, IsArray, IsUUID, IsDateString } from 'class-validator';

export class CreateLogDto {
  @IsUUID()
  workout_plan_id!: string;

  @IsString()
  @IsNotEmpty()
  plan_day!: string;

  @IsDateString()
  logged_date!: string;

  @IsArray()
  exercises!: Array<{
    name: string;
    sets: Array<{ weight_kg: number; reps: number; completed: boolean }>;
  }>;
}
