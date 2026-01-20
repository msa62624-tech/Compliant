import { Controller, Get, Param, Patch, Body, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { RemindersService } from "./reminders.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("reminders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("reminders")
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get("coi/:coiId")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Get reminder history for a specific COI" })
  @ApiResponse({ status: 200, description: "Returns reminder history" })
  async getReminderHistory(@Param("coiId") coiId: string) {
    return this.remindersService.getReminderHistory(coiId);
  }

  @Get("pending")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: "Get all pending (unacknowledged) reminders" })
  @ApiResponse({ status: 200, description: "Returns pending reminders" })
  async getPendingReminders() {
    return this.remindersService.getPendingReminders();
  }

  @Get("stats")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: "Get reminder statistics" })
  @ApiResponse({ status: 200, description: "Returns reminder stats" })
  async getReminderStats() {
    return this.remindersService.getReminderStats();
  }

  @Patch(":reminderId/acknowledge")
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: "Acknowledge a reminder" })
  @ApiResponse({
    status: 200,
    description: "Reminder acknowledged successfully",
  })
  async acknowledgeReminder(
    @Param("reminderId") reminderId: string,
    @Body("acknowledgedBy") acknowledgedBy: string,
  ) {
    return this.remindersService.acknowledgeReminder(
      reminderId,
      acknowledgedBy,
    );
  }
}
