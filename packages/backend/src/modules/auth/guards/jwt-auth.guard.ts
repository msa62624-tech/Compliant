import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}

// Re-export ConditionalAuthGuard for easier imports
export { ConditionalAuthGuard } from '../../../common/guards/conditional-auth.guard';
