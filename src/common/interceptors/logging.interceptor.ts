import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const start = Date.now();

    return next
      .handle()
      .pipe(
        tap(() =>
          console.log(
            `${request.method} ${request.url} ${Date.now() - start}ms`,
          ),
        ),
      );
  }
}
