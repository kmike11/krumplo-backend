import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(
    err: unknown,
    user: TUser | null | undefined,
    ..._rest: [unknown?, ExecutionContext?]
  ): TUser {
    void _rest;
    if (err || !user) {
      if (err instanceof Error) {
        throw err;
      }
      throw new UnauthorizedException();
    }

    return user;
  }
}
