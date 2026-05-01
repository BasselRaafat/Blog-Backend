import { User } from '../entities/user.entity';

export class UserSummaryDto {
  id: string;
  name: string;
  email: string;
  profilePic: string;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.profilePic = user.picPath;
  }
}
