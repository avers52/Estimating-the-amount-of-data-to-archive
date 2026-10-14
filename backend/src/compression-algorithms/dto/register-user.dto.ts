import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ example: 'Аверьянов А.Д.', description: 'Имя пользователя', required: false })
  full_name?: string;

  @ApiProperty({ example: 'avers@test.ru', description: 'Электронная почта' })
  email: string;

  @ApiProperty({ example: 'avers123', description: 'Пароль' })
  password: string;
}