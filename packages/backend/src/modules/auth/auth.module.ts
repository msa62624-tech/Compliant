import { Module } from "@nestjs/common";
import { JwtModule, JwtModuleOptions } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: async (
        configService: ConfigService,
      ): Promise<JwtModuleOptions> => {
        const expiresIn = configService.get<string>("JWT_EXPIRATION") || "15m";
        return {
          secret: configService.get<string>("JWT_SECRET") as string,
          signOptions: {
            // Type assertion is required because ConfigService.get<string>() returns string,
            // but SignOptions.expiresIn expects StringValue (a strict template literal type) | number.
            // Using 'as never' forces TypeScript to accept the value without using the overly broad 'as any'.
            // The runtime value is guaranteed to be valid (e.g., "15m", "1h", "7d") by configuration.
            expiresIn: expiresIn as never,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
