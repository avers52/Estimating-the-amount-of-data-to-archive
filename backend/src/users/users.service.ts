import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async register(data: { login: string; password: string }) {
    // Проверка, занят ли логин
    const existing = await this.userRepo.findOne({ where: { email: data.login } });
    if (existing) {
      throw new ConflictException('Пользователь с таким логином уже существует');
    }

    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);

      const user = this.userRepo.create({
        name: data.login,       // можно продублировать логин в full_name или оставить null
        email: data.login,      // логин сохраняется в уникальное поле email
        password: hashedPassword,
      });

      const saved = await this.userRepo.save(user);

      return {
        id: saved.id,
        login: saved.email,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async validateUser(login: string, pass: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { email: login } });
    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    return user;
  }
}