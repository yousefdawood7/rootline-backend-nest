import {
  CustomDecorator,
  ExecutionContext,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import type {
  CurrentUser as CurrentUserType,
  UserSessionData,
} from '../types/auth.types';

export const AllowAnonymous = (): CustomDecorator<string> =>
  SetMetadata('PUBLIC', true);

export const OptionalAuth = (): CustomDecorator<string> =>
  SetMetadata('OPTIONAL', true);

export const Roles = (...roles: (string | string[])[]): CustomDecorator => {
  const flatRoles = roles.flat();
  return SetMetadata('ROLES', flatRoles);
};

export const Session = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserSessionData | null => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ session?: UserSessionData }>();
    return request.session ?? null;
  },
);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserType | null => {
    const request = ctx.switchToHttp().getRequest<{
      user?: CurrentUserType;
      session?: { user?: CurrentUserType };
    }>();
    return request.user ?? request.session?.user ?? null;
  },
);
