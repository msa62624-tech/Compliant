import { Controller, Get, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async getUserSessions(@Request() req) {
    return this.sessionsService.getUserSessions(req.user.userId);
  }

  @Delete(':token')
  async revokeSession(@Param('token') token: string) {
    await this.sessionsService.revokeSession(token);
    return { message: 'Session revoked successfully' };
  }

  @Delete()
  async revokeAllSessions(@Request() req) {
    await this.sessionsService.revokeAllUserSessions(req.user.userId);
    return { message: 'All sessions revoked successfully' };
  }
}
