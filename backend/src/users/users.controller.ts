import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('api')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.usersService.register({
      name: body.full_name || body.name,
      email: body.email,
      password: body.password,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login() {
    return { message: 'ok' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return { message: 'ok' };
  }
}


