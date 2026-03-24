import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { type Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserEntity } from './user.entity';
import { type JwtPayload, type RegisterResult, UserService } from './user.service';

interface AuthedRequest extends Request {
  user?: JwtPayload;
}

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: '用户注册（示例接口）' })
  @ApiResponse({ status: 201, description: '注册成功，返回 JWT' })
  @Post('register')
  async register(@Body() dto: CreateUserDto): Promise<RegisterResult> {
    return await this.userService.register(dto);
  }

  @ApiOperation({ summary: '管理员创建用户（指定角色和初始密码）' })
  @ApiBearerAuth('bearer')
  @ApiResponse({ status: 201, type: UserEntity })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin-create')
  async adminCreate(@Req() req: AuthedRequest, @Body() dto: AdminCreateUserDto): Promise<UserEntity> {
    const actorUserId = req.user?.sub ?? 0;
    const user = await this.userService.createByAdmin(dto, actorUserId);
    return plainToInstance(UserEntity, user);
  }

  @ApiOperation({ summary: '管理员更新用户启用状态' })
  @ApiBearerAuth('bearer')
  @ApiResponse({ status: 200, type: UserEntity })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/:id')
  async adminUpdate(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ): Promise<UserEntity> {
    const actorUserId = req.user?.sub ?? 0;
    const user = await this.userService.updateByAdmin(Number(id), dto.isEnabled, actorUserId);
    return plainToInstance(UserEntity, user);
  }

  @ApiOperation({ summary: '用户列表（Admin）' })
  @ApiBearerAuth('bearer')
  @ApiResponse({ status: 200, type: [UserEntity] })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('list')
  async list(): Promise<UserEntity[]> {
    const users = await this.userService.findAll();
    return users.map((u) => plainToInstance(UserEntity, u));
  }

  @ApiOperation({ summary: '获取当前用户资料（需要 JWT）' })
  @ApiBearerAuth('bearer')
  @ApiResponse({ status: 200, description: '返回用户资料（不包含密码）' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'REVIEW', 'ADMIN')
  @Get('profile')
  async profile(@Req() req: AuthedRequest): Promise<UserEntity> {
    const userId = req.user?.sub;
    if (!userId) {
      return plainToInstance(UserEntity, {});
    }
    const user = await this.userService.getProfile(userId);
    return plainToInstance(UserEntity, user);
  }

  @ApiOperation({ summary: '更新当前用户资料（用户名/邮箱/密码）' })
  @ApiBearerAuth('bearer')
  @ApiResponse({ status: 200, type: UserEntity })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR', 'REVIEW', 'ADMIN')
  @Patch('profile')
  async updateProfile(@Req() req: AuthedRequest, @Body() dto: UpdateProfileDto): Promise<UserEntity> {
    const userId = req.user?.sub;
    if (!userId) {
      return plainToInstance(UserEntity, {});
    }
    const user = await this.userService.updateProfile(userId, dto);
    return plainToInstance(UserEntity, user);
  }
}

