import { BlogSummaryDto } from 'src/modules/blogs/dto/blog-summary.dto';
import { User } from '../entities/user.entity';

export class UserDetailsDto {
  id: string;
  name: string;
  email: string;

  blogs: BlogSummaryDto[];

  profilePic: string;
  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.profilePic = user.picPath;
    this.blogs = user.blogs.map((b) => new BlogSummaryDto(b));
  }
}
