import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Render,
  Redirect,
} from '@nestjs/common';
import { CompressionAlgorithmsService } from './compression-algorithms.service';

@Controller('compression-algorithms')
export class CompressionAlgorithmsController {
  constructor(
    private readonly algoService: CompressionAlgorithmsService,
  ) {}

  @Get('feed')
  @Render('algorithm_feed')
  async getFeed(@Query('algorithm_id') id?: string) {
    const algorithm = await this.algoService.getFeed(id);
    return { algorithm };
  }

  @Get('catalog')
  @Render('algorithm_catalog')
  async getCatalog(@Query('min_compression_ratio') minRatio?: string) {
    const ratio = minRatio ? parseFloat(minRatio) : undefined;
    const algorithmsList = await this.algoService.getCatalog(ratio);
    return { algorithmsList, filterValue: minRatio };
  }

  @Get('draft')
  @Render('algorithm_draft')
  async getDraft() {
    const draftAlgorithm = await this.algoService.getUserDraft(1);
    return { draftAlgorithm };
  }

  @Post('draft/create')
  @Redirect('/compression-algorithms/draft')
  async createDraft(@Body() body: any) {
    await this.algoService.createDraft(body.algorithm_name || body.name, 1);
  }

  @Post('draft/publish/:id')
  @Redirect('/compression-algorithms/catalog')
  async publishDraft(@Param('id') id: string, @Body() body: any) {
    await this.algoService.publishDraft(
      id,
      body.algorithm_description || body.description,
      parseFloat(body.compression_ratio),
      parseFloat(body.compression_speed_mbps),
      body.image_url,
      body.video_url,
    );
  }


  @Post('catalog/delete/:id')
  @Redirect('/compression-algorithms/catalog')
  async deleteAlgorithm(@Param('id') id: string) {
    await this.algoService.deleteAlgorithmRawSql(id);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return await this.algoService.getAlgorithmById(id);
  }
}