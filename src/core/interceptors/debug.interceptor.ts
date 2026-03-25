/* eslint-disable no-debugger */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class DebugInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    const req = context.switchToHttp().getRequest();

    // Print request info always
    if (process.env.DEBUG_API === 'true') {
      console.log(`🛠️  API Hit: ${req.method} ${req.url}`);
      console.log('Body:', JSON.stringify(req.body, null, 2));
      console.log('Params:', JSON.stringify(req.params, null, 2));
      console.log('Query:', JSON.stringify(req.query, null, 2));
    }

    // Only pause if VS Code debugger is attached
    const isDebuggerAttached = !!process.debugPort; // true if debugger attached
    if (process.env.DEBUG_API === 'true' && isDebuggerAttached) {
      console.log('💡 Debugger attached — pausing for inspection...');
      debugger; // only triggers if a debugger is attached
    }

    return next.handle().pipe(
      tap((response) => {
        if (process.env.DEBUG_API === 'true') {
          console.log('Response:', JSON.stringify(response, null, 2));
        }
      }),
    );
  }
}
