import { Controller, Get, Post, Render, Query, Param, Body, Redirect } from '@nestjs/common';
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

  // ШАГ 1: Создание черновика с названием и медиа
  @Post('draft/create')
  @Redirect('/compression-algorithms/draft')
  async createDraftForm(@Body() body: any) {
    await this.algoService.createService(
      body.algorithm_name,
      undefined, // файлов нет (форма отправляет url)
      {
        imageUrl: body.image_url,
        videoUrl: body.video_url,
      },
    );
  }

  // ШАГ 2: Публикация с остальными параметрами
  @Post('draft/publish')
  @Redirect('/compression-algorithms/catalog')
  async publishDraftForm(@Body() body: any) {
    const draft = await this.algoService.getDraft();
    if (!draft) return;

    await this.algoService.publishService(draft.algorithm_id, {
      description: body.algorithm_description || '',
      compression_ratio: parseFloat(body.compression_ratio) || 1.0,
      compression_speed_mbps: parseInt(body.compression_speed_mbps, 10) || 100,
    });
  }

  // Удаление алгоритма из каталога (soft delete)
  @Post('catalog/delete/:id')
  @Redirect('/compression-algorithms/catalog')
  async deleteForm(@Param('id') id: string) {
    if (id) {
      await this.algoService.deleteService(parseInt(id, 10));
    }
  }
}