import { Controller, Get, Query, Render, NotFoundException } from '@nestjs/common';
import { CompressionAlgorithmsService } from './compression-algorithms.service.js';

@Controller('compression-algorithms')
export class CompressionAlgorithmsController {
  constructor(private readonly algorithmsService: CompressionAlgorithmsService) {}

  @Get('feed')
  @Render('algorithm_feed')
  getAlgorithmFeed(
    @Query('algorithm_id') algorithmId?: string,
    @Query('next') next?: string,
  ) {
    const currentId = algorithmId ? parseInt(algorithmId, 10) : undefined;
    const isNext = next === 'true';
    const algorithm = this.algorithmsService.getFeedAlgorithm(currentId, isNext);

    if (!algorithm) {
      throw new NotFoundException('Алгоритмы не найдены');
    }

    return { algorithm };
  }

  @Get('draft')
  @Render('algorithm_draft')
  getDraftView() {
    const draftAlgorithm = this.algorithmsService.getDraftAlgorithm();
    return { draftAlgorithm };
  }

  @Get('catalog')
  @Render('algorithm_catalog')
  getCatalogView(@Query('min_compression_ratio') minRatio?: string) {
    const ratioNum = minRatio ? parseFloat(minRatio) : undefined;
    const algorithmsList = this.algorithmsService.getPublishedAlgorithms(ratioNum);

    return {
      algorithmsList,
      filterValue: minRatio || '',
    };
  }
}