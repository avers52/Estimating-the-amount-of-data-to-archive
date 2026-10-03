import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async register(data: { name: string; email: string; password: string }) {
    // 1. Проверяем, существует ли уже пользователь с таким email
    const existing = await this.userRepo.findOne({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    try {
      // 2. Создаем сущность
      const user = this.userRepo.create({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      const saved = await this.userRepo.save(user);

      // 3. Возвращаем ответ без вывода пароля
      return {
        id: Number(saved.id),
        email: saved.email,
        full_name: saved.name,
      };
    } catch (error: any) {
      console.error('Ошибка при сохранении пользователя:', error);
      const message = error instanceof Error ? error.message: 'Database error'
      throw new InternalServerErrorException(error.message);
    }
  }
}
