import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (!request.session || !request.session.userId) {
      throw new UnauthorizedException('Требуется авторизация в системе');
    }
    return true;
  }
}