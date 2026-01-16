import { Controller, Post, Get, Delete, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('messaging')
@Controller('messaging')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post()
  async sendMessage(
    @Body() body: { receiverId: string; subject: string; message: string },
    @Request() req,
  ) {
    return this.messagingService.sendMessage(
      req.user.userId,
      body.receiverId,
      body.subject,
      body.message,
    );
  }

  @Get()
  async getMessages(@Query('type') type: 'sent' | 'received' | 'all', @Request() req) {
    return this.messagingService.getMessages(req.user.userId, type || 'all');
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.messagingService.getUnreadCount(req.user.userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.messagingService.markAsRead(id, req.user.userId);
  }

  @Delete(':id')
  async deleteMessage(@Param('id') id: string, @Request() req) {
    return this.messagingService.deleteMessage(id, req.user.userId);
  }
}
