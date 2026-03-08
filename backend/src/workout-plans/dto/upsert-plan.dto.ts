import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class UpsertPlanDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsObject()
  plan_data!: Record<string, unknown>;
}
