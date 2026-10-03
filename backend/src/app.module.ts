import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompressionAlgorithmsModule } from './compression-algorithms/compression-algorithms.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { CompressionAlgorithm } from './compression-algorithms/entities/compression-algorithm.entity';
import { AlgorithmLike } from './compression-algorithms/entities/algorithm-like.entity';
import { MinioService } from './common/minio.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'archive_db',
      entities: [User, CompressionAlgorithm, AlgorithmLike],
      synchronize: false,
    }),
    CompressionAlgorithmsModule,
    UsersModule,
  ],
  providers: [MinioService],
  exports: [MinioService],
})
export class AppModule {}
