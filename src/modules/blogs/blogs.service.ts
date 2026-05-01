import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { Repository } from 'typeorm';
import { Blog } from './entities/blog.entity';
import { randomUUID } from 'node:crypto';
import { JwtPayload } from 'src/common/types/jwt-payload.type';
import { SupabaseService } from 'src/common/services/SupabaseService ';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepo: Repository<Blog>,
    private readonly supabaseService: SupabaseService,
  ) {}
  async create(
    createBlogDto: CreateBlogDto,
    coverPic: Express.Multer.File,
    user: JwtPayload,
  ) {
    const blog = this.blogRepo.create({
      id: randomUUID(),
      ...createBlogDto,
      userId: user.sub,
    });
    const coverPicPath = `blogs/${user.sub}/${randomUUID()}`;
    const { data, error } = await this.supabaseService
      .getClient()
      .storage.from('pics')
      .upload(coverPicPath, coverPic.buffer, {
        contentType: coverPic.mimetype,
      });
    if (error) {
      console.log(error);
      throw new Error(
        'somthing went wrong while uploading the cvoer pic, try again',
      );
    }
    try {
      blog.coverPicPath = data.path;
      return await this.blogRepo.save(blog);
    } catch (e) {
      await this.supabaseService.deleteFile(coverPicPath);
      throw e;
    }
  }

  async findAll() {
    const blogs = await this.blogRepo.find({
      relations: { user: true },
      select: {
        content: false,
        coverPicPath: true,
        createdAt: true,
        description: true,
        id: true,
        title: true,
        userId: true,
      },
    });
    blogs.forEach((blog) => {
      const { data } = this.supabaseService
        .getClient()
        .storage.from('pics')
        .getPublicUrl(blog.coverPicPath);
      const { data: userData } = this.supabaseService
        .getClient()
        .storage.from('pics')
        .getPublicUrl(blog.user.picPath);
      blog.coverPicPath = data.publicUrl;
      blog.user.picPath = userData.publicUrl;
    });
    return blogs;
  }

  async findOne(id: string) {
    const blog = await this.blogRepo.findOne({
      where: { id },
      relations: { user: true },
      order: { createdAt: -1 },
    });
    if (!blog) throw new NotFoundException(`blog with id ${id} not found`);
    const { data } = this.supabaseService
      .getClient()
      .storage.from('pics')
      .getPublicUrl(blog.coverPicPath);
    const { data: userData } = this.supabaseService
      .getClient()
      .storage.from('pics')
      .getPublicUrl(blog.user.picPath);
    blog.coverPicPath = data.publicUrl;
    blog.user.picPath = userData.publicUrl;
    return blog;
  }

  async update(
    id: string,
    updateBlogDto: UpdateBlogDto,
    coverPic: Express.Multer.File | undefined,
    user: JwtPayload,
  ) {
    const blog = await this.blogRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!blog) throw new NotFoundException(`blog with id ${id} not found`);
    if (blog.userId !== user.sub) {
      throw new UnauthorizedException(
        'Your are not the owner of this blog, you are not authorized to delete it',
      );
    }

    // Handle image upload if provided
    if (coverPic) {
      const oldCoverPicPath = blog.coverPicPath;
      const coverPicPath = `blogs/${user.sub}/${randomUUID()}`;
      const { data, error } = await this.supabaseService
        .getClient()
        .storage.from('pics')
        .upload(coverPicPath, coverPic.buffer, {
          contentType: coverPic.mimetype,
        });
      if (error) {
        console.log(error);
        throw new Error(
          'Something went wrong while uploading the cover pic, try again',
        );
      }
      blog.coverPicPath = data.path;
      // Delete old image if it exists
      if (oldCoverPicPath) {
        await this.supabaseService.deleteFile(oldCoverPicPath);
      }
    }
    // Only merge the provided properties from updateBlogDto
    const newBlog = this.blogRepo.merge(blog, updateBlogDto);
    return await this.blogRepo.save(newBlog);
  }

  async remove(id: string, user: JwtPayload) {
    const blog = await this.blogRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!blog) throw new NotFoundException(`blog with id ${id} not found`);
    if (blog.userId !== user.sub) {
      throw new UnauthorizedException(
        'Your are not the owner of this blog, you are not authorized to delete it',
      );
    }
    // Optionally delete the cover pic from Supabase
    if (blog.coverPicPath) {
      await this.supabaseService.deleteFile(blog.coverPicPath);
    }
    return await this.blogRepo.remove(blog);
  }
}
