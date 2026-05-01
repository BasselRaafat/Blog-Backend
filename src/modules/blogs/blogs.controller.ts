import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  ParseFilePipe,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { type JwtPayload } from 'src/common/types/jwt-payload.type';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { BlogSummaryDto } from './dto/blog-summary.dto';
import { BlogDetailsDto } from './dto/blog-details.dto';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('coverPic', { storage: memoryStorage() }))
  @Post()
  create(
    @Body() createBlogDto: CreateBlogDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [],
        fileIsRequired: true,
      }),
    )
    coverPic: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.blogsService.create(createBlogDto, coverPic, user);
  }

  @Get()
  async findAll() {
    const blogs = await this.blogsService.findAll();
    const mappedBlogs = blogs.map((b) => new BlogSummaryDto(b));
    return mappedBlogs;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const blog = await this.blogsService.findOne(id);
    const mappedBlog = new BlogDetailsDto(blog);
    return mappedBlog;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('coverPic', { storage: memoryStorage() }))
  async update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [],
        fileIsRequired: false,
      }),
    )
    coverPic: Express.Multer.File | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    const blog = await this.blogsService.update(
      id,
      updateBlogDto,
      coverPic,
      user,
    );
    const mappedBlog = new BlogSummaryDto(blog);
    return mappedBlog;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const blog = await this.blogsService.remove(id, user);
    const mappedBlog = new BlogSummaryDto(blog);
    return mappedBlog;
  }
}
