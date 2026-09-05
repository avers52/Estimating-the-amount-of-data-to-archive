import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompressionAlgorithmsModule } from './compression-algorithms/compression-algorithms.module';
import { User } from './users/entities/user.entity';
import { CompressionAlgorithm } from './compression-algorithms/entities/compression-algorithm.entity';
import { AlgorithmLike } from './compression-algorithms/entities/algorithm-like.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password123',
      database: 'archive_db',
      entities: [User, CompressionAlgorithm, AlgorithmLike],
      synchronize: true,
    }),
    CompressionAlgorithmsModule,
  ],
})
export class AppModule {}


