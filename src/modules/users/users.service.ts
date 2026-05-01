import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { SupabaseService } from 'src/common/services/SupabaseService ';
import { randomUUID } from 'crypto';
import { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly supabaseService: SupabaseService,
  ) {}

  async create(
    userDto: RegisterDto,
    passwordHash: string,
    profilePic: Express.Multer.File,
  ): Promise<User> {
    const user = this.usersRepository.create({
      id: randomUUID(),
      email: userDto.email,
      name: userDto.name,
      hashedRefreshToken: null,
      passwordHash: passwordHash,
    });
    const picPath = `profile-pics/${user.id}/${randomUUID()}`;
    const { data, error } = await this.supabaseService
      .getClient()
      .storage.from('pics')
      .upload(picPath, profilePic.buffer, {
        contentType: profilePic.mimetype,
      });
    if (error) {
      throw new Error(error.message);
    }
    try {
      user.picPath = data.path;
      return await this.usersRepository.save(user);
    } catch (e) {
      await this.supabaseService.deleteFile(picPath);
      throw e;
    }
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      select: { passwordHash: true, id: true, email: true },
    });
  }

  async findById(id: string, includeBlogs: boolean = false): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { blogs: includeBlogs },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { data: userData } = this.supabaseService
      .getClient()
      .storage.from('pics')
      .getPublicUrl(user.picPath);
    user.picPath = userData.publicUrl;
    return user;
  }

  async updateHashedRefreshToken(
    userId: string,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    await this.usersRepository.update(userId, { hashedRefreshToken });
  }
  async exist(id: string) {
    const isExist = await this.usersRepository.exists({
      where: { id },
    });
    if (!isExist)
      throw new NotFoundException(`User with id ${id} is not found`);
    return isExist;
  }
}
