import { Controller, Post, Body, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { UsersService } from './users.service';

// DTO только с логином и паролем
export class AuthCredentialsDto {
  @ApiProperty({ example: 'avers', description: 'Логин пользователя' })
  login: string;

  @ApiProperty({ example: 'avers123', description: 'Пароль' })
  password: string;
}

@ApiTags('Аутентификация и пользователи')
@Controller('api')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация пользователя по логину и паролю' })
  @ApiResponse({ status: 201, description: 'Пользователь успешно зарегистрирован' })
  @ApiResponse({ status: 409, description: 'Пользователь с таким логином уже существует' })
  async register(@Body() body: AuthCredentialsDto) {
    return this.usersService.register({
      login: body.login,
      password: body.password,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вход в систему по логину и паролю (установка сессии)' })
  @ApiResponse({ status: 200, description: 'Успешная авторизация, выдана сессионная cookie connect.sid' })
  @ApiResponse({ status: 401, description: 'Неверный логин или пароль' })
  async login(@Body() body: AuthCredentialsDto, @Req() req: Request) {
    const user = await this.usersService.validateUser(body.login, body.password);
    (req.session as any).userId = user.id;

    return {
      message: 'Успешный вход в систему',
      userId: user.id,
      login: user.email, // колонка email хранит логин
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Выход из системы (уничтожение сессии)' })
  @ApiResponse({ status: 200, description: 'Сессия успешно завершена' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) return reject(err);
        res.clearCookie('connect.sid');
        resolve({ message: 'Сессия успешно завершена' });
      });
    });
  }
}