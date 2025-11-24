import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private buildAuthResponse(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<string> {
    return this.jwtService.signAsync({ sub: userId, email, role });
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const role =
      dto.role && dto.role in UserRole ? (dto.role as UserRole) : UserRole.USER;
    if (role === UserRole.ADMIN) {
      throw new BadRequestException(
        'Admin accounts can only be created by existing admins.',
      );
    }

    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      displayName: dto.displayName,
      role,
    });

    const accessToken = await this.buildAuthResponse(
      user.id,
      user.email,
      user.role,
    );

    return {
      accessToken,
      user: this.usersService.toResponseDto(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.buildAuthResponse(
      user.id,
      user.email,
      user.role,
    );

    return {
      accessToken,
      user: this.usersService.toResponseDto(user),
    };
  }

  async validateUser(payload: JwtPayload) {
    return this.usersService.findById(payload.sub);
  }
}
