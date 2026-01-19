import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { Request as ExpressRequest } from "express";
import { GeneratedCOIService } from "./generated-coi.service";
import { CreateCOIDto } from "./dto/create-coi.dto";
import { UpdateBrokerInfoDto } from "./dto/update-broker-info.dto";
import { UploadPoliciesDto } from "./dto/upload-policies.dto";
import { SignPoliciesDto } from "./dto/sign-policies.dto";
import { ReviewCOIDto } from "./dto/review-coi.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@Controller("generated-coi")
export class GeneratedCOIController {
  constructor(private readonly generatedCOIService: GeneratedCOIService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createCOIDto: CreateCOIDto, @Request() req: ExpressRequest) {
    return this.generatedCOIService.create(createCOIDto, req.user?.email);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req: ExpressRequest) {
    const currentUser = {
      role: req.user!.role,
      email: req.user!.email,
    };
    return this.generatedCOIService.findAll(currentUser);
  }

  @Get("expiring")
  @UseGuards(JwtAuthGuard)
  findExpiring() {
    return this.generatedCOIService.findExpiring(30);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  findOne(@Param("id") id: string) {
    return this.generatedCOIService.findOne(id);
  }

  @Patch(":id/broker-info")
  @UseGuards(JwtAuthGuard)
  updateBrokerInfo(
    @Param("id") id: string,
    @Body() updateBrokerInfoDto: UpdateBrokerInfoDto,
  ) {
    return this.generatedCOIService.updateBrokerInfo(id, updateBrokerInfoDto);
  }

  @Patch(":id/upload")
  @UseGuards(JwtAuthGuard)
  uploadPolicies(
    @Param("id") id: string,
    @Body() uploadPoliciesDto: UploadPoliciesDto,
  ) {
    return this.generatedCOIService.uploadPolicies(id, uploadPoliciesDto);
  }

  @Patch(":id/sign")
  @UseGuards(JwtAuthGuard)
  signPolicies(
    @Param("id") id: string,
    @Body() signPoliciesDto: SignPoliciesDto,
  ) {
    return this.generatedCOIService.signPolicies(id, signPoliciesDto);
  }

  @Patch(":id/review")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER)
  reviewCOI(
    @Param("id") id: string,
    @Body() reviewCOIDto: ReviewCOIDto,
    @Request() req: ExpressRequest,
  ) {
    return this.generatedCOIService.reviewCOI(
      id,
      reviewCOIDto,
      req.user!.email,
    );
  }

  @Post(":id/renew")
  @UseGuards(JwtAuthGuard)
  renewCOI(@Param("id") id: string, @Request() req: ExpressRequest) {
    return this.generatedCOIService.renewCOI(id, req.user?.email);
  }

  @Patch(":id/resubmit")
  @UseGuards(JwtAuthGuard)
  resubmitDeficiency(@Param("id") id: string) {
    return this.generatedCOIService.resubmitDeficiency(id);
  }
}
