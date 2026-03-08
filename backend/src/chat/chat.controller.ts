import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  sendMessage(
    @Request() req: { user: { userId: string } },
    @Body() body: { message: string },
  ) {
    return this.chatService.sendMessage(req.user.userId, body.message);
  }

  @Get('history')
  getHistory(@Request() req: { user: { userId: string } }) {
    return this.chatService.getHistory(req.user.userId);
  }
}
