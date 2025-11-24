import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { UserEntity } from '../../users/user.entity';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UserEntity | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: UserEntity }>();
    return request.user;
  },
);
