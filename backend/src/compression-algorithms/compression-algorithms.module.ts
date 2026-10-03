import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompressionAlgorithmsController } from './compression-algorithms.controller';
import { CompressionAlgorithmsService } from './compression-algorithms.service';
import { CompressionAlgorithm } from './entities/compression-algorithm.entity';
import { AlgorithmLike } from './entities/algorithm-like.entity';
import { MinioService } from '../common/minio.service';

@Module({
  imports: [TypeOrmModule.forFeature([CompressionAlgorithm, AlgorithmLike])],
  controllers: [CompressionAlgorithmsController],
  providers: [CompressionAlgorithmsService, MinioService],
})
export class CompressionAlgorithmsModule {}