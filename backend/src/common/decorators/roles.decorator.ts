import { SetMetadata } from '@nestjs/common';

import type { UserRole } from '../../modules/user/user.entity';

export const ROLES_KEY = 'roles';

// 简体中文注释：声明当前接口允许访问的角色列表
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

