import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpsertProfileDto } from './dto/upsert-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Request() req: { user: { userId: string } }) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Put('profile')
  upsertProfile(
    @Request() req: { user: { userId: string } },
    @Body() dto: UpsertProfileDto,
  ) {
    return this.usersService.upsertProfile(req.user.userId, dto);
  }
}
