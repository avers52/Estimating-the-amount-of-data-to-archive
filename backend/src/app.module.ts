import { Module } from '@nestjs/common';
import { CompressionAlgorithmsController } from './compression-algorithms/compression-algorithms.controller.js';
import { CompressionAlgorithmsService } from './compression-algorithms/compression-algorithms.service.js';

@Module({
  imports: [],
  controllers: [CompressionAlgorithmsController],
  providers: [CompressionAlgorithmsService],
})
export class AppModule {}