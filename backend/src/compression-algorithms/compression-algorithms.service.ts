import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { CompressionAlgorithm, AlgorithmStatus } from './entities/compression-algorithm.entity';
import { AlgorithmLike } from './entities/algorithm-like.entity';
import { MinioService } from '../common/minio.service';
import { toAlgorithmDto, AlgorithmResponseDto } from './dto/algorithm-response.dto';
import { UploadedFile } from '../common/uploaded-file.interface';

@Injectable()
export class CompressionAlgorithmsService {
  constructor(
    @InjectRepository(CompressionAlgorithm)
    private readonly algoRepo: Repository<CompressionAlgorithm>,
    @InjectRepository(AlgorithmLike)
    private readonly likeRepo: Repository<AlgorithmLike>,
    private readonly minioService: MinioService,
  ) {}

  // 1. GET /api/compression-algorithms — список опубликованных алгоритмов (публичный)
  async getCatalog(minRatio?: number, currentUserId?: number): Promise<AlgorithmResponseDto[]> {
    const where: any = { algorithm_status: AlgorithmStatus.PUBLISHED };

    if (minRatio !== undefined && !isNaN(minRatio)) {
      where.compression_ratio = MoreThanOrEqual(minRatio);
    }

    const items = await this.algoRepo.find({
      where,
      order: { algorithm_id: 'ASC' },
    });

    return Promise.all(
      items.map(async (algo) => {
        const likesCount = await this.likeRepo.count({
          where: { algorithm_id: algo.algorithm_id },
        });

        const isLiked = currentUserId
          ? await this.likeRepo.exists({
              where: {
                algorithm_id: algo.algorithm_id,
                user_id: currentUserId,
              },
            })
          : false;

        return toAlgorithmDto(algo, currentUserId ?? 0, likesCount, isLiked);
      }),
    );
  }

  // 2. GET /api/compression-algorithms/feed — лента алгоритмов (публичный)
  async getFeed(currentId?: string, isNext?: boolean, currentUserId?: number): Promise<AlgorithmResponseDto> {
    let targetAlgo: CompressionAlgorithm | null = null;

    if (currentId) {
      const parsedId = parseInt(currentId, 10);
      if (isNext) {
        targetAlgo = await this.algoRepo
          .createQueryBuilder('algo')
          .where('algo.algorithm_status = :status', { status: AlgorithmStatus.PUBLISHED })
          .andWhere('algo.algorithm_id > :id', { id: parsedId })
          .orderBy('algo.algorithm_id', 'ASC')
          .getOne();
      } else {
        targetAlgo = await this.algoRepo.findOne({
          where: {
            algorithm_id: parsedId,
            algorithm_status: AlgorithmStatus.PUBLISHED,
          },
        });
      }
    }

    if (!targetAlgo) {
      targetAlgo = await this.algoRepo.findOne({
        where: { algorithm_status: AlgorithmStatus.PUBLISHED },
        order: { algorithm_id: 'ASC' },
      });
    }

    if (!targetAlgo) {
      throw new NotFoundException('Опубликованные алгоритмы сжатия не найдены');
    }

    const likesCount = await this.likeRepo.count({
      where: { algorithm_id: targetAlgo.algorithm_id },
    });

    const isLiked = currentUserId
      ? await this.likeRepo.exists({
          where: {
            algorithm_id: targetAlgo.algorithm_id,
            user_id: currentUserId,
          },
        })
      : false;

    return toAlgorithmDto(targetAlgo, currentUserId ?? 0, likesCount, isLiked);
  }

  // 3. GET /api/compression-algorithms/draft — получение черновика авторизованного создателя
  async getDraft(creatorId: number): Promise<AlgorithmResponseDto> {
    const draft = await this.algoRepo.findOne({
      where: {
        creator_id: creatorId,
        algorithm_status: AlgorithmStatus.DRAFT,
      },
    });

    if (!draft) {
      throw new NotFoundException('Активный черновик алгоритма не найден');
    }

    return toAlgorithmDto(draft, creatorId, 0, false);
  }

  // 4. POST /api/compression-algorithms — создание черновика с автозаполнением creator_id
  async createService(
    name: string,
    files?: { image?: UploadedFile[]; video?: UploadedFile[] },
    customUrls?: { imageUrl?: string; videoUrl?: string },
    creatorId?: number,
  ): Promise<AlgorithmResponseDto> {
    if (!name || name.trim() === '') {
      throw new BadRequestException('Поле algorithm_name обязательно для заполнения');
    }
    if (!creatorId) {
      throw new ForbiddenException('Не определен автор алгоритма');
    }

    let existingDraft = await this.algoRepo.findOne({
      where: {
        creator_id: creatorId,
        algorithm_status: AlgorithmStatus.DRAFT,
      },
    });

    let imageUrl = customUrls?.imageUrl || existingDraft?.image_url || '';
    let videoUrl = customUrls?.videoUrl || existingDraft?.video_url || '';

    if (files && files.image && files.image[0]) {
      imageUrl = await this.minioService.uploadFile(files.image[0], 'image');
    }
    if (files && files.video && files.video[0]) {
      videoUrl = await this.minioService.uploadFile(files.video[0], 'video');
    }

    if (!imageUrl) imageUrl = '/gzip_draft.png';
    if (!videoUrl) videoUrl = '/gzip_process.mp4';

    if (existingDraft) {
      existingDraft.algorithm_name = name;
      existingDraft.image_url = imageUrl;
      existingDraft.video_url = videoUrl;
      const saved = await this.algoRepo.save(existingDraft);
      return toAlgorithmDto(saved, creatorId, 0, false);
    }

    const draft = this.algoRepo.create({
      algorithm_name: name,
      creator_id: creatorId,
      algorithm_status: AlgorithmStatus.DRAFT,
      image_url: imageUrl,
      video_url: videoUrl,
    });

    const saved = await this.algoRepo.save(draft);
    return toAlgorithmDto(saved, creatorId, 0, false);
  }

  // 5. PUT /api/compression-algorithms/:id/publish — публикация с проверкой авторства
  async publishService(
    id: number,
    data: {
      description: string;
      compression_ratio: number;
      compression_speed_mbps: number;
    },
    creatorId: number,
  ): Promise<AlgorithmResponseDto> {
    const algo = await this.algoRepo.findOne({
      where: { algorithm_id: id },
    });

    if (!algo || algo.algorithm_status === AlgorithmStatus.DELETED) {
      throw new NotFoundException('Алгоритм не найден');
    }
    if (algo.creator_id !== creatorId) {
      throw new ForbiddenException('Редактировать и публиковать алгоритм может только его создатель');
    }
    if (algo.algorithm_status !== AlgorithmStatus.DRAFT) {
      throw new BadRequestException('Опубликовать можно только черновик');
    }

    algo.algorithm_description = data.description;
    algo.compression_ratio = data.compression_ratio;
    algo.compression_speed_mbps = data.compression_speed_mbps;
    algo.algorithm_status = AlgorithmStatus.PUBLISHED;
    algo.configured_at = new Date();

    const saved = await this.algoRepo.save(algo);
    return toAlgorithmDto(saved, creatorId, 0, false);
  }

  // 6. DELETE /api/compression-algorithms/:id — мягкое удаление с проверкой авторства
  async deleteService(id: number, creatorId: number): Promise<void> {
    const algo = await this.algoRepo.findOne({
      where: { algorithm_id: id },
    });

    if (!algo || algo.algorithm_status === AlgorithmStatus.DELETED) {
      throw new NotFoundException('Алгоритм не найден');
    }
    if (algo.creator_id !== creatorId) {
      throw new ForbiddenException('Удалять алгоритм может только его создатель');
    }

    algo.algorithm_status = AlgorithmStatus.DELETED;
    await this.algoRepo.save(algo);
  }

  // 7. POST /api/compression-algorithms/:id/like — оценка алгоритма авторизованным пользователем
  async setLike(algorithmId: number, isLiked: number, userId: number): Promise<void> {
    const algo = await this.algoRepo.findOne({
      where: {
        algorithm_id: algorithmId,
        algorithm_status: AlgorithmStatus.PUBLISHED,
      },
    });

    if (!algo) {
      throw new NotFoundException('Опубликованный алгоритм не найден');
    }

    const existingLike = await this.likeRepo.findOne({
      where: {
        user_id: userId,
        algorithm_id: algorithmId,
      },
    });

    if (isLiked === 1 && !existingLike) {
      const newLike = this.likeRepo.create({
        user_id: userId,
        algorithm_id: algorithmId,
      });
      await this.likeRepo.save(newLike);
    } else if (isLiked === 0 && existingLike) {
      await this.likeRepo.delete({
        user_id: userId,
        algorithm_id: algorithmId,
      });
    }
  }
}