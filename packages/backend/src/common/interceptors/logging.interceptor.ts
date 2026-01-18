import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  LoggerService,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    // Sanitize user agent to prevent log injection
    const userAgent = (headers["user-agent"] || "")
      .substring(0, 200)
      .replace(/[\r\n]/g, "");
    const userId = request.user?.id || "anonymous";
    const now = Date.now();

    // Log incoming request with structured data
    this.logger.log({
      message: `Incoming request: ${method} ${url}`,
      context: "HTTP",
      method,
      url,
      ip,
      userAgent,
      userId,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const delay = Date.now() - now;

          // Log successful response with structured data
          this.logger.log({
            message: `Response: ${method} ${url}`,
            context: "HTTP",
            method,
            url,
            statusCode: response.statusCode,
            responseTime: `${delay}ms`,
            userId,
          });
        },
        error: (error) => {
          const delay = Date.now() - now;

          // Log error response with structured data
          this.logger.error({
            message: `Error: ${method} ${url}`,
            context: "HTTP",
            method,
            url,
            error: error.message,
            stack: error.stack,
            responseTime: `${delay}ms`,
            userId,
          });
        },
      }),
    );
  }
}
