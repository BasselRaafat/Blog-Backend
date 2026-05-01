import { UserSummaryDto } from 'src/modules/users/dto/user-summary.dto';
import { Blog } from '../entities/blog.entity';

export class BlogDetailsDto {
  id: string;

  title: string;

  description: string;

  content: string;

  coverPicPath: string;

  userId: string;

  user: UserSummaryDto;

  createdAt: Date;

  constructor(blog: Blog) {
    this.id = blog.id;
    this.title = blog.title;
    this.description = blog.description;
    this.createdAt = blog.createdAt;
    this.user = new UserSummaryDto(blog.user);
    this.userId = blog.userId;
    this.coverPicPath = blog.coverPicPath;
    this.description = blog.description;
    this.content = blog.content;
  }
}
