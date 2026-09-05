import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  Render,
  Redirect,
} from '@nestjs/common';
import { CompressionAlgorithmsService } from './compression-algorithms.service';

@Controller('compression-algorithms')
export class CompressionAlgorithmsController {
  constructor(private readonly algoService: CompressionAlgorithmsService) {}

  // 1. GET FEED
  @Get('feed')
  @Render('algorithm_feed')
  async getFeed(@Query('algorithm_id') algorithmId?: string) {
    const algo = await this.algoService.getFeed(algorithmId);
    return { algorithm: algo };
  }

  // 2. GET CATALOG
  @Get('catalog')
  @Render('algorithm_catalog')
  async getCatalog(@Query('min_compression_ratio') minRatio?: string) {
    const ratio = minRatio ? parseFloat(minRatio) : undefined;
    const algorithms = await this.algoService.getCatalog(ratio);
    return { algorithms, minRatio };
  }

  // 3. GET DRAFT
  @Get('draft')
  @Render('algorithm_draft')
  async getDraft() {
    const draft = await this.algoService.getUserDraft('1');
    return { draft, hasDraft: !!draft };
  }

  // 4. POST CREATE (Шаг 1: кнопка "Далее" через ORM)
  @Post('draft/create')
  @Redirect('/compression-algorithms/draft', 302)
  async createDraft(
    @Body('name') name: string,
    @Body('image_url') imageUrl: string,
    @Body('video_url') videoUrl: string,
  ) {
    await this.algoService.createDraft(name, imageUrl, videoUrl, '1');
    return;
  }

  // 5. POST PUBLISH (Шаг 2: кнопка "Опубликовать" через ORM)
  @Post('draft/publish/:id')
  @Redirect('/compression-algorithms/catalog', 302)
  async publishDraft(
    @Param('id') id: string,
    @Body('description') desc: string,
    @Body('compression_ratio') ratio: string,
    @Body('compression_speed_mbps') speed: string,
  ) {
    await this.algoService.publishDraft(
      id,
      desc,
      parseFloat(ratio),
      parseFloat(speed),
    );
    return;
  }

  // 6. POST DELETE (Удаление через чистый SQL UPDATE)
  @Post('catalog/delete/:id')
  @Redirect('/compression-algorithms/catalog', 302)
  async deleteAlgorithm(@Param('id') id: string) {
    await this.algoService.deleteAlgorithmRawSql(id);
    return;
  }

  // Просмотр по прямому ID
  @Get(':id')
  @Render('algorithm_feed')
  async getById(@Param('id') id: string) {
    const algo = await this.algoService.getAlgorithmById(id);
    return { algorithm: algo };
  }
}