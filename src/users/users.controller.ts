import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';
import { UserEntity } from './user.entity';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getCurrentUser(@CurrentUser() user: UserEntity) {
    const freshUser = await this.usersService.findByIdOrFail(user.id);
    return this.usersService.toResponseDto(freshUser);
  }

  @Patch('me')
  async updateCurrentUser(
    @CurrentUser() user: UserEntity,
    @Body() dto: UpdateUserDto,
  ) {
    const updated = await this.usersService.updateProfile(user.id, dto);
    return this.usersService.toResponseDto(updated);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async listUsers() {
    const users = await this.usersService.listAll();
    return users.map((entity) => this.usersService.toResponseDto(entity));
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateUserRole(
    @Param('id') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    const updated = await this.usersService.updateRole(userId, dto);
    return this.usersService.toResponseDto(updated);
  }
}
