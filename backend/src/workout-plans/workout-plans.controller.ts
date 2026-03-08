import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkoutPlansService } from './workout-plans.service';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { UpsertPlanDto } from './dto/upsert-plan.dto';

@Controller('workout-plans')
@UseGuards(JwtAuthGuard)
export class WorkoutPlansController {
  constructor(private readonly service: WorkoutPlansService) {}

  @Post('generate')
  generate(
    @Request() req: { user: { userId: string } },
    @Body() dto: GeneratePlanDto,
  ) {
    return this.service.generatePlan(req.user.userId, dto.preferences);
  }

  @Get()
  getAll(@Request() req: { user: { userId: string } }) {
    return this.service.getPlans(req.user.userId);
  }

  @Get(':id')
  getOne(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.service.getPlan(req.user.userId, id);
  }

  @Post()
  create(
    @Request() req: { user: { userId: string } },
    @Body() dto: UpsertPlanDto,
  ) {
    return this.service.createPlan(req.user.userId, dto);
  }

  @Put(':id')
  update(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: UpsertPlanDto,
  ) {
    return this.service.updatePlan(req.user.userId, id, dto);
  }

  @Delete(':id')
  delete(
    @Request() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    return this.service.deletePlan(req.user.userId, id);
  }
}
