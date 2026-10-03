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
import { getCurrentUser } from '../common/current-user.singleton';
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

  // 1. GET /api/services — список услуг с фильтрацией (только PUBLISHED, без DELETED)
  async getCatalog(minRatio?: number): Promise<AlgorithmResponseDto[]> {
    const user = getCurrentUser();
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
          where: { algorithm_id: String(algo.algorithm_id) as any },
        });
        const isLiked = await this.likeRepo.exists({
          where: {
            algorithm_id: String(algo.algorithm_id) as any,
            user_id: String(user.id) as any,
          },
        });
        return toAlgorithmDto(algo, user.id, likesCount, isLiked);
      }),
    );
  }

  // 2. GET /api/services/feed — лента по ID и без ID с поддержкой ?next=true
  async getFeed(currentId?: string, isNext?: boolean): Promise<AlgorithmResponseDto> {
    const user = getCurrentUser();
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
      throw new NotFoundException();
    }

    const likesCount = await this.likeRepo.count({
      where: { algorithm_id: String(targetAlgo.algorithm_id) as any },
    });
    const isLiked = await this.likeRepo.exists({
      where: {
        algorithm_id: String(targetAlgo.algorithm_id) as any,
        user_id: String(user.id) as any,
      },
    });

    return toAlgorithmDto(targetAlgo, user.id, likesCount, isLiked);
  }

  // 3. GET /api/services/draft — получение черновика текущего пользователя (не более 1 записи)
  async getDraft(): Promise<AlgorithmResponseDto> {
    const user = getCurrentUser();
    const draft = await this.algoRepo.findOne({
      where: {
        creator_id: user.id,
        algorithm_status: AlgorithmStatus.DRAFT,
      },
    });

    if (!draft) {
      throw new NotFoundException();
    }

    return toAlgorithmDto(draft, user.id, 0, false);
  }

    // 4. POST /api/services — создание черновика с загрузкой файлов в MinIO
  async createService(
    name: string,
    files: { image?: UploadedFile[]; video?: UploadedFile[] },
  ): Promise<AlgorithmResponseDto> {
    const user = getCurrentUser();

    let existingDraft = await this.algoRepo.findOne({
      where: {
        creator_id: user.id,
        algorithm_status: AlgorithmStatus.DRAFT,
      },
    });

    let imageUrl = existingDraft?.image_url ?? '';
    let videoUrl = existingDraft?.video_url ?? '';

    if (files.image?.[0]) {
      imageUrl = await this.minioService.uploadFile(files.image[0], 'image');
    }
    if (files.video?.[0]) {
      videoUrl = await this.minioService.uploadFile(files.video[0], 'video');
    }

    if (existingDraft) {
      existingDraft.algorithm_name = name;
      existingDraft.image_url = imageUrl;
      existingDraft.video_url = videoUrl;
      const saved = await this.algoRepo.save(existingDraft);
      return toAlgorithmDto(saved, user.id, 0, false);
    }

    const draft = this.algoRepo.create({
      algorithm_name: name,
      creator_id: user.id,
      algorithm_status: AlgorithmStatus.DRAFT,
      image_url: imageUrl,
      video_url: videoUrl,
    });

    const saved = await this.algoRepo.save(draft);
    return toAlgorithmDto(saved, user.id, 0, false);
  }


  // 5. PUT /api/services/:id/publish — смена статуса с draft на published
  async publishService(
    id: number,
    data: {
      description: string;
      compression_ratio: number;
      compression_speed_mbps: number;
    },
  ): Promise<AlgorithmResponseDto> {
    const user = getCurrentUser();
    const algo = await this.algoRepo.findOne({
      where: { algorithm_id: id },
    });

    if (!algo || algo.algorithm_status === AlgorithmStatus.DELETED) {
      throw new NotFoundException();
    }
    if (algo.creator_id !== user.id) {
      throw new ForbiddenException();
    }
    if (algo.algorithm_status !== AlgorithmStatus.DRAFT) {
      throw new BadRequestException();
    }

    algo.algorithm_description = data.description;
    algo.compression_ratio = data.compression_ratio;
    algo.compression_speed_mbps = data.compression_speed_mbps;
    algo.algorithm_status = AlgorithmStatus.PUBLISHED;

    const saved = await this.algoRepo.save(algo);
    return toAlgorithmDto(saved, user.id, 0, false);
  }

  // 6. DELETE /api/services/:id — soft delete (только для услуг этого пользователя)
  async deleteService(id: number): Promise<void> {
    const user = getCurrentUser();
    const algo = await this.algoRepo.findOne({
      where: { algorithm_id: id },
    });

    if (!algo || algo.algorithm_status === AlgorithmStatus.DELETED) {
      throw new NotFoundException();
    }
    if (algo.creator_id !== user.id) {
      throw new ForbiddenException();
    }

    algo.algorithm_status = AlgorithmStatus.DELETED;
    await this.algoRepo.save(algo);
  }

  // 7. POST /api/services/:id/like — 1 ставит лайк, 0 снимает лайк
  async setLike(algorithmId: number, isLiked: number): Promise<void> {
    const user = getCurrentUser();
    const algo = await this.algoRepo.findOne({
      where: {
        algorithm_id: algorithmId,
        algorithm_status: AlgorithmStatus.PUBLISHED,
      },
    });

    if (!algo) {
      throw new NotFoundException();
    }

    const existingLike = await this.likeRepo.findOne({
      where: {
        user_id: String(user.id),
        algorithm_id: String(algorithmId),
      },
    });

    if (isLiked === 1 && !existingLike) {
      const newLike = this.likeRepo.create({
        user_id: String(user.id),
        algorithm_id: String(algorithmId),
      });
      await this.likeRepo.save(newLike);
    } else if (isLiked === 0 && existingLike) {
      await this.likeRepo.delete({
        user_id: String(user.id),
        algorithm_id: String(algorithmId),
      });
    }
  }
}
