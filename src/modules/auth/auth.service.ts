import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, profilePic: Express.Multer.File) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }
    console.log(dto.password);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    console.log(passwordHash);

    await this.usersService.create(dto, passwordHash, profilePic);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.issueTokens(user.id, user.email);
    const resUser = await this.usersService.findById(user.id);
    return {
      ...tokens,
      id: resUser.id,
      name: resUser.name,
      profilePic: resUser.picPath,
      email: resUser.email,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const user = await this.usersService.findById(payload.sub);
    if (!user.hashedRefreshToken) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    const isMatch = await bcrypt.compare(
      dto.refreshToken,
      user.hashedRefreshToken,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return this.issueTokens(user.id, user.email);
  }

  async logout(userId: string) {
    await this.usersService.updateHashedRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  private async issueTokens(userId: string, email: string) {
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      tokenType: 'access',
    };
    const refreshPayload: JwtPayload = {
      sub: userId,
      email,
      tokenType: 'refresh',
    };
    const accessExpiresIn = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES',
      '15m',
    );
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES',
      '7d',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn as never,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn as never,
      }),
    ]);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateHashedRefreshToken(
      userId,
      hashedRefreshToken,
    );

    return { accessToken, refreshToken };
  }

  private verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }
}
