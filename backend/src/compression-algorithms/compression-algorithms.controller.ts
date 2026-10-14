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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CompressionAlgorithmsService } from './compression-algorithms.service';
import { AlgorithmResponseDto } from './dto/algorithm-response.dto';
import { UploadedFile } from '../common/uploaded-file.interface';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { Req } from '@nestjs/common'; // убедитесь, что Req импортирован
import { Request } from 'express';

@ApiTags('Алгоритмы сжатия (Домен)')
@Controller('api/compression-algorithms')
export class CompressionAlgorithmsController {
  constructor(private readonly algoService: CompressionAlgorithmsService) {}

  // 1. Публичный доступ: просмотр каталога
  @Get()
  @ApiOperation({ summary: 'Каталог опубликованных алгоритмов (публичный доступ без авторизации)' })
  @ApiQuery({ name: 'min_compression_ratio', required: false, type: Number, example: 2.0 })
  @ApiResponse({ status: 200, description: 'Список опубликованных алгоритмов сжатия' })
  async getCatalog(
    @Query('min_compression_ratio') minRatio?: string,
    @CurrentUserId() userId?: number,
  ): Promise<AlgorithmResponseDto[]> {
    const parsed = minRatio ? parseFloat(minRatio) : undefined;
    return this.algoService.getCatalog(parsed, userId);
  }

  // 2. Публичный доступ: лента алгоритмов
  @Get('feed')
  @ApiOperation({ summary: 'Лента опубликованных алгоритмов (публичный доступ без авторизации)' })
  @ApiQuery({ name: 'algorithm_id', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'next', required: false, type: Boolean, example: true })
  @ApiResponse({ status: 200, description: 'Алгоритм ленты' })
  @ApiResponse({ status: 404, description: 'Алгоритмы не найдены' })
  async getFeed(
    @Query('algorithm_id') id?: string,
    @Query('next') next?: string,
    @CurrentUserId() userId?: number,
  ): Promise<AlgorithmResponseDto> {
    return this.algoService.getFeed(id, next === 'true', userId);
  }

  // 3. Защищенный доступ: получение черновика
  @Get('draft')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('connect.sid')
  @ApiOperation({ summary: 'Получение полей текущего черновика (только для авторизованного автора)' })
  async getDraft(
    @Req() req: Request,
    @CurrentUserId() userId: number,
  ): Promise<AlgorithmResponseDto> {
    console.log('=== АКТИВНАЯ СЕССИЯ ПОЛЬЗОВАТЕЛЯ (cmd/session store) ===');
    console.log('ID сессии (SessionID):', req.sessionID);
    console.log('Данные сессии (Session Data):', req.session);
    console.log('Идентификатор пользователя (userId):', userId);
    console.log('========================================================');

    return this.algoService.getDraft(userId);
  }

  // 4. Защищенный доступ: создание черновика с автозаполнением создателя
  @Post()
  @UseGuards(AuthGuard)
  @ApiCookieAuth('connect.sid')
  @ApiOperation({ summary: 'Создание черновика алгоритма (автозаполнение creator_id из сессии)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        algorithm_name: { type: 'string', example: 'Deflate-V2' },
        image: { type: 'string', format: 'binary', description: 'Изображение/график степени сжатия' },
        video: { type: 'string', format: 'binary', description: 'Демонстрационный видеоролик компрессии' },
      },
      required: ['algorithm_name'],
    },
  })
  @ApiResponse({ status: 201, description: 'Черновик алгоритма создан с привязкой к текущей сессии' })
  @ApiResponse({ status: 400, description: 'Некорректные параметры запроса' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация в системе' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'video', maxCount: 1 },
    ]),
  )
  async createService(
    @Body('algorithm_name') name: string,
    @UploadedFiles() files: { image?: UploadedFile[]; video?: UploadedFile[] },
    @CurrentUserId() userId: number,
  ): Promise<AlgorithmResponseDto> {
    return this.algoService.createService(name, files, undefined, userId);
  }

  // 5. Защищенный доступ: публикация черновика
  @Put(':id/publish')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('connect.sid')
  @ApiOperation({ summary: 'Публикация алгоритма (только для автора создателя)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        algorithm_description: { type: 'string', example: 'Высокоэффективный потоковый алгоритм сжатия данных' },
        compression_ratio: { type: 'number', example: 3.45 },
        compression_speed_mbps: { type: 'integer', example: 520 },
      },
      required: ['algorithm_description', 'compression_ratio', 'compression_speed_mbps'],
    },
  })
  @ApiResponse({ status: 200, description: 'Алгоритм успешно опубликован' })
  @ApiResponse({ status: 400, description: 'Опубликовать можно только объект в статусе draft' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация в системе' })
  @ApiResponse({ status: 403, description: 'Редактировать и публиковать алгоритм может только его создатель' })
  async publishService(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      algorithm_description: string;
      compression_ratio: number;
      compression_speed_mbps: number;
    },
    @CurrentUserId() userId: number,
  ): Promise<AlgorithmResponseDto> {
    return this.algoService.publishService(
      id,
      {
        description: body.algorithm_description,
        compression_ratio: parseFloat(String(body.compression_ratio)),
        compression_speed_mbps: parseInt(String(body.compression_speed_mbps), 10),
      },
      userId,
    );
  }

  // 6. Защищенный доступ: мягкое удаление
  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('connect.sid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Мягкое удаление алгоритма автором (статус deleted)' })
  @ApiResponse({ status: 204, description: 'Алгоритм помечен как удаленный' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация в системе' })
  @ApiResponse({ status: 403, description: 'Удалять алгоритм может только его создатель' })
  async deleteService(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUserId() userId: number,
  ): Promise<void> {
    return this.algoService.deleteService(id, userId);
  }

  // 7. Защищенный доступ: оценка алгоритма
  @Post(':id/like')
  @UseGuards(AuthGuard)
  @ApiCookieAuth('connect.sid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Поставить (1) или снять (0) отметку «Нравится»' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        is_liked: { type: 'integer', enum: [0, 1], example: 1 },
      },
      required: ['is_liked'],
    },
  })
  @ApiResponse({ status: 200, description: 'Лайк успешно обновлен' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация в системе' })
  async setLike(
    @Param('id', ParseIntPipe) id: number,
    @Body('is_liked', ParseIntPipe) isLiked: number,
    @CurrentUserId() userId: number,
  ): Promise<void> {
    return this.algoService.setLike(id, isLiked, userId);
  }
}