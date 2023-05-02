import { CanActivate, ExecutionContext } from '@nestjs/common';

export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    console.log('AdminGuard running');
    if (!req.currentUser) {
      return false;
    }
    return req.currentUser.isAdmin;
  }
}
