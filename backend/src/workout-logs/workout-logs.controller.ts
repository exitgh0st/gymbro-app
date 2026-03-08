import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkoutLogsService } from './workout-logs.service';
import { CreateLogDto } from './dto/create-log.dto';

@Controller('workout-logs')
@UseGuards(JwtAuthGuard)
export class WorkoutLogsController {
  constructor(private readonly service: WorkoutLogsService) {}

  @Post()
  create(
    @Request() req: { user: { userId: string } },
    @Body() dto: CreateLogDto,
  ) {
    return this.service.createLog(req.user.userId, dto);
  }

  @Get()
  getAll(@Request() req: { user: { userId: string } }) {
    return this.service.getLogs(req.user.userId);
  }
}
