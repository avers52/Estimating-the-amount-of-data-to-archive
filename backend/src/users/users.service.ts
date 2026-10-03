import { Injectable, ConflictException } from '@nestjs/common';
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
    const existing = await this.userRepo.findOne({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException();
    }
    const user = this.userRepo.create({
      name: data.name,
      email: data.email,
      password: data.password,
    });
    const saved = await this.userRepo.save(user);
    return {
      id: Number(saved.id),
      email: saved.email,
      name: saved.name,
    };
  }
}
