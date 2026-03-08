import { IsOptional, IsString } from 'class-validator';

export class GeneratePlanDto {
  @IsOptional()
  @IsString()
  preferences?: string;
}
