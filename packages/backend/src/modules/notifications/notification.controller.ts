import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseBoolPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import {
  NotificationsService,
  ReplyToNotificationDto,
} from "./notifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../../common/decorators/get-user.decorator";
import { User } from "@prisma/client";

@ApiTags("Notifications")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Get all notifications for current user" })
  @ApiQuery({
    name: "unreadOnly",
    required: false,
    type: Boolean,
    description: "Filter to only unread notifications",
  })
  @ApiResponse({
    status: 200,
    description: "Notifications retrieved successfully",
  })
  getNotifications(
    @GetUser() user: User,
    @Query("unreadOnly", new DefaultValuePipe(false), ParseBoolPipe)
    unreadOnly?: boolean,
  ) {
    return this.notificationsService.getNotifications(user.id, unreadOnly);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single notification by ID" })
  @ApiParam({ name: "id", description: "Notification ID" })
  @ApiResponse({
    status: 200,
    description: "Notification retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Notification not found" })
  getNotification(@Param("id") id: string, @GetUser() user: User) {
    return this.notificationsService.getNotification(id, user.id);
  }

  @Post(":id/read")
  @ApiOperation({ summary: "Mark notification as read" })
  @ApiParam({ name: "id", description: "Notification ID" })
  @ApiResponse({ status: 200, description: "Notification marked as read" })
  @ApiResponse({ status: 404, description: "Notification not found" })
  markAsRead(@Param("id") id: string, @GetUser() user: User) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Post("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  @ApiResponse({ status: 200, description: "All notifications marked as read" })
  async markAllAsRead(@GetUser() user: User) {
    await this.notificationsService.markAllAsRead(user.id);
    return { message: "All notifications marked as read" };
  }

  @Post(":id/reply")
  @ApiOperation({ summary: "Reply to a notification (creates a thread)" })
  @ApiParam({ name: "id", description: "Notification ID to reply to" })
  @ApiResponse({ status: 201, description: "Reply created successfully" })
  @ApiResponse({ status: 404, description: "Notification not found" })
  replyToNotification(
    @Param("id") id: string,
    @Body() replyData: ReplyToNotificationDto,
    @GetUser() user: User,
  ) {
    return this.notificationsService.replyToNotification(id, user, replyData);
  }

  @Get("thread/:threadId")
  @ApiOperation({ summary: "Get all notifications in a thread" })
  @ApiParam({ name: "threadId", description: "Thread ID" })
  @ApiResponse({
    status: 200,
    description: "Thread notifications retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Thread not found" })
  getThread(@Param("threadId") threadId: string, @GetUser() user: User) {
    return this.notificationsService.getThread(threadId, user.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a notification" })
  @ApiParam({ name: "id", description: "Notification ID" })
  @ApiResponse({
    status: 200,
    description: "Notification deleted successfully",
  })
  @ApiResponse({ status: 404, description: "Notification not found" })
  async deleteNotification(@Param("id") id: string, @GetUser() user: User) {
    await this.notificationsService.deleteNotification(id, user.id);
    return { message: "Notification deleted successfully" };
  }
}
