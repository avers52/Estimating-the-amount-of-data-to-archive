import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CompressionAlgorithmsService } from './compression-algorithms.service';
import { AlgorithmResponseDto } from './dto/algorithm-response.dto';
import { UploadedFile } from '../common/uploaded-file.interface';

@Controller('api/services')
export class CompressionAlgorithmsController {
  constructor(private readonly algoService: CompressionAlgorithmsService) {}

  @Get()
  async getCatalog(
    @Query('min_compression_ratio') minRatio?: string,
  ): Promise<AlgorithmResponseDto[]> {
    const parsed = minRatio ? parseFloat(minRatio) : undefined;
    return this.algoService.getCatalog(parsed);
  }

  @Get('feed')
  async getFeed(
    @Query('algorithm_id') id?: string,
    @Query('next') next?: string,
  ): Promise<AlgorithmResponseDto> {
    return this.algoService.getFeed(id, next === 'true');
  }

  @Get('draft')
  async getDraft(): Promise<AlgorithmResponseDto> {
    return this.algoService.getDraft();
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'video', maxCount: 1 },
    ]),
  )
  async createService(
    @Body('algorithm_name') name: string,
    @UploadedFiles()
    files: { image?: UploadedFile[]; video?: UploadedFile[] },
  ): Promise<AlgorithmResponseDto> {
    return this.algoService.createService(name, files);
  }


  @Put(':id/publish')
  async publishService(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      algorithm_description: string;
      compression_ratio: number;
      compression_speed_mbps: number;
    },
  ): Promise<AlgorithmResponseDto> {
    return this.algoService.publishService(id, {
      description: body.algorithm_description,
      compression_ratio: parseFloat(String(body.compression_ratio)),
      compression_speed_mbps: parseInt(String(body.compression_speed_mbps), 10),
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteService(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.algoService.deleteService(id);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  async setLike(
    @Param('id', ParseIntPipe) id: number,
    @Body('is_liked', ParseIntPipe) isLiked: number,
  ): Promise<void> {
    return this.algoService.setLike(id, isLiked);
  }
}
