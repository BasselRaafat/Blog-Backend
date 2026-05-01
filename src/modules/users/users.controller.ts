import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload.type';
import { UsersService } from './users.service';
import { UserDetailsDto } from './dto/user-details.dto';
import { UserSummaryDto } from './dto/user-summary.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload) {
    const currentUser = await this.usersService.findById(user.sub);
    const mappedUser = new UserSummaryDto(currentUser);
    return mappedUser;
  }
  @Get(':id')
  async getUserById(@Param('id') userId: string) {
    const currentUser = await this.usersService.findById(userId, true);
    const mappedUser = new UserDetailsDto(currentUser);
    return mappedUser;
  }
}
