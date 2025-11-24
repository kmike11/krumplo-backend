import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserEntity } from './user.entity';

@Injectable()
export class UsersService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async ensureEmailAvailable(email: string) {
    const existing = await this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email address already in use');
    }
  }

  async create(params: {
    email: string;
    password: string;
    displayName: string;
    role?: UserRole;
  }) {
    await this.ensureEmailAvailable(params.email);

    const hashedPassword = await bcrypt.hash(params.password, this.saltRounds);
    const entity = this.usersRepository.create({
      email: params.email.toLowerCase(),
      password: hashedPassword,
      displayName: params.displayName,
      role: params.role ?? UserRole.USER,
    });

    return this.usersRepository.save(entity);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async listAll() {
    return this.usersRepository.find({ order: { createdAt: 'ASC' } });
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.findByIdOrFail(userId);

    if (dto.displayName) {
      user.displayName = dto.displayName;
    }

    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, this.saltRounds);
    }

    return this.usersRepository.save(user);
  }

  async updateRole(userId: string, dto: UpdateUserRoleDto) {
    const user = await this.findByIdOrFail(userId);
    user.role = dto.role;
    return this.usersRepository.save(user);
  }

  toResponseDto(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
