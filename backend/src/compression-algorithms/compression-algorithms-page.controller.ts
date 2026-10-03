import { Controller, Get, Render, Query } from '@nestjs/common';
import { CompressionAlgorithmsService } from './compression-algorithms.service';

@Controller('compression-algorithms')
export class CompressionAlgorithmsPageController {
  constructor(private readonly algoService: CompressionAlgorithmsService) {}

  @Get('catalog')
  @Render('algorithm_catalog')
  async getCatalogPage(@Query('min_compression_ratio') minRatio?: string) {
    const parsed = minRatio ? parseFloat(minRatio) : undefined;
    const list = await this.algoService.getCatalog(parsed);
    return {
      algorithmsList: list,
      filterValue: minRatio || '1.0',
    };
  }

  @Get('feed')
  @Render('algorithm_feed')
  async getFeedPage(
    @Query('algorithm_id') id?: string,
    @Query('next') next?: string,
  ) {
    const algo = await this.algoService.getFeed(id, next === 'true');
    return { algorithm: algo };
  }

  @Get('draft')
  @Render('algorithm_draft')
  async getDraftPage() {
    try {
      const draft = await this.algoService.getDraft();
      return { draftAlgorithm: draft };
    } catch {
      return { draftAlgorithm: null };
    }
  }
}
