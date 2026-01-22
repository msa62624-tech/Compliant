import { Module } from "@nestjs/common";
import { JwtModule, JwtModuleOptions } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import type * as ms from "ms";
import { AuthService } from "./auth.service";
import { SimpleAuthService } from "./simple-auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UsersModule } from "../users/users.module";
import { PrismaModule } from "../../config/prisma.module";

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: async (
        configService: ConfigService,
      ): Promise<JwtModuleOptions> => {
        const expiresIn = configService.get<string>("JWT_EXPIRATION") || "15m";
        return {
          secret: configService.get<string>("JWT_SECRET") as string,
          signOptions: {
            expiresIn: expiresIn as ms.StringValue,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService, 
    SimpleAuthService, 
    // Only register JwtStrategy if NOT using simple auth
    ...(process.env.USE_SIMPLE_AUTH === 'true' ? [] : [JwtStrategy]),
  ],
  controllers: [AuthController],
  exports: [AuthService, SimpleAuthService],
})
export class AuthModule {}
