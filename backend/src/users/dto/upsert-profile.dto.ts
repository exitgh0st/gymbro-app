import { IsString, IsNotEmpty, IsInt, IsNumber, Min, Max, IsIn } from 'class-validator';

export class UpsertProfileDto {
  @IsString() @IsNotEmpty()
  name!: string;

  @IsInt() @Min(1) @Max(119)
  age!: number;

  @IsNumber() @Min(50) @Max(300)
  height_cm!: number;

  @IsNumber() @Min(20) @Max(500)
  weight_kg!: number;

  @IsString() @IsIn(['male', 'female', 'other', 'prefer_not_to_say'])
  gender!: string;

  @IsString() @IsIn(['lose_weight', 'build_muscle', 'improve_endurance', 'increase_strength', 'general_fitness', 'improve_flexibility'])
  fitness_goal!: string;

  @IsString() @IsIn(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'])
  activity_level!: string;
}
