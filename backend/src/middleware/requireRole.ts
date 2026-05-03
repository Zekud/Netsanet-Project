// Role guard middleware — restricts route access to specific user roles.
// Usage: router.get('/admin', authenticate, requireRole('system_admin'), handler)

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication is required',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
}
