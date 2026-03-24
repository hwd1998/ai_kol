import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductEntity } from './product.entity';
import { ProductService } from './product.service';
import { type JwtPayload } from '../user/user.service';

interface AuthedRequest extends Request {
  user?: JwtPayload;
}

@ApiTags('products')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @ApiOperation({ summary: '产品列表（达人/审核/管理员）' })
  @ApiResponse({ status: 200, type: [ProductEntity] })
  @Roles('CREATOR', 'REVIEW', 'ADMIN')
  @Get()
  async findAll(@Req() req: AuthedRequest): Promise<ProductEntity[]> {
    const onlyEnabled = req.user?.role === 'CREATOR';
    return await this.productService.findAll(onlyEnabled);
  }

  @ApiOperation({ summary: '创建产品（Admin）' })
  @ApiResponse({ status: 201, type: ProductEntity })
  @Roles('ADMIN')
  @Post()
  async create(@Req() req: AuthedRequest, @Body() dto: CreateProductDto): Promise<ProductEntity> {
    const actorUserId = req.user?.sub ?? 0;
    return await this.productService.create(dto, actorUserId);
  }

  @ApiOperation({ summary: '更新产品（Admin）' })
  @ApiResponse({ status: 200, type: ProductEntity })
  @Roles('ADMIN')
  @Patch(':id')
  async update(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductEntity> {
    const actorUserId = req.user?.sub ?? 0;
    return await this.productService.update(Number(id), dto, actorUserId);
  }

  @ApiOperation({ summary: '删除产品（Admin）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ ok: true }> {
    await this.productService.remove(Number(id));
    return { ok: true };
  }
}
