import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThanOrEqual } from 'typeorm';
import {
  CompressionAlgorithm,
  AlgorithmStatus,
} from './entities/compression-algorithm.entity';
import { AlgorithmLike } from './entities/algorithm-like.entity';

@Injectable()
export class CompressionAlgorithmsService {
  constructor(
    @InjectRepository(CompressionAlgorithm)
    private readonly algoRepo: Repository<CompressionAlgorithm>,
    @InjectRepository(AlgorithmLike)
    private readonly likeRepo: Repository<AlgorithmLike>,
    private readonly dataSource: DataSource,
  ) {}

  // 1. GET FEED (ORM)
  async getFeed(currentId?: string) {
    let algorithm: CompressionAlgorithm | null = null;

    if (currentId) {
      algorithm = await this.algoRepo.findOne({
        where: {
          id: currentId as any,
          status: AlgorithmStatus.PUBLISHED,
        },
      });
    }

    // Если id не указан или алгоритм не найден — берем первый опубликованный
    if (!algorithm) {
      algorithm = await this.algoRepo.findOne({
        where: { status: AlgorithmStatus.PUBLISHED },
        order: { id: 'ASC' as any },
      });
    }

    if (!algorithm) return null;

    // Ищем ID следующего опубликованного алгоритма (для кнопки "Следующий ->")
    const nextAlgo = await this.algoRepo
      .createQueryBuilder('algo')
      .where('algo.status = :status', { status: AlgorithmStatus.PUBLISHED })
      .andWhere('algo.id > :currentId', { currentId: algorithm.id })
      .orderBy('algo.id', 'ASC')
      .getOne();

    // Если дошли до конца списка — закольцовываем на первый
    const firstAlgo = await this.algoRepo.findOne({
      where: { status: AlgorithmStatus.PUBLISHED },
      order: { id: 'ASC' as any },
    });

    const nextId = nextAlgo ? nextAlgo.id : (firstAlgo ? firstAlgo.id : algorithm.id);

    const likesCount = await this.likeRepo.count({
      where: { algorithm_id: algorithm.id as any },
    });

    return {
      ...algorithm,
      nextId,
      likes_count: likesCount,
    };
  }

  // 2. GET CATALOG (ORM)
  async getCatalog(minRatio?: number) {
    const whereCondition: any = {
      status: AlgorithmStatus.PUBLISHED,
    };

    if (minRatio !== undefined && !isNaN(minRatio)) {
      whereCondition.compression_ratio = MoreThanOrEqual(minRatio);
    }

    const algorithms = await this.algoRepo.find({
      where: whereCondition,
      order: { id: 'ASC' as any },
    });

    return Promise.all(
      algorithms.map(async (algo) => {
        const likesCount = await this.likeRepo.count({
          where: { algorithm_id: algo.id as any },
        });
        return {
          ...algo,
          likes_count: likesCount,
        };
      }),
    );
  }

  // 3. GET DRAFT (ORM)
  async getUserDraft(userId: string = '1') {
    return await this.algoRepo.findOne({
      where: {
        creator_id: userId as any,
        status: AlgorithmStatus.DRAFT,
      },
    });
  }

  // 4. POST DRAFT CREATE (Шаг 1: кнопка "Далее", ORM)
  async createDraft(
    name: string,
    imageUrl: string,
    videoUrl: string,
    userId: string = '1',
  ) {
    const existingDraft = await this.getUserDraft(userId);
    if (existingDraft) {
      existingDraft.name = name;
      existingDraft.image_url = imageUrl;
      existingDraft.video_url = videoUrl;
      return await this.algoRepo.save(existingDraft);
    }

    const draft = this.algoRepo.create({
      name,
      image_url: imageUrl,
      video_url: videoUrl,
      creator_id: userId,
      status: AlgorithmStatus.DRAFT,
    });
    return await this.algoRepo.save(draft);
  }

  // 5. POST DRAFT PUBLISH (Шаг 2: кнопка "Опубликовать", ORM)
  async publishDraft(
    id: string,
    description: string,
    compressionRatio: number,
    compressionSpeedMbps: number,
  ) {
    const draft = await this.algoRepo.findOne({
      where: {
        id: id as any,
        status: AlgorithmStatus.DRAFT,
      },
    });

    if (!draft) {
      throw new NotFoundException('Черновик не найден');
    }

    draft.description = description;
    draft.compression_ratio = compressionRatio;
    draft.compression_speed_mbps = compressionSpeedMbps;
    draft.status = AlgorithmStatus.PUBLISHED;
    draft.formed_at = new Date();

    return await this.algoRepo.save(draft);
  }

  // 6. POST CATALOG DELETE (Чистый SQL UPDATE без ORM)
  async deleteAlgorithmRawSql(id: string) {
    const query = `
      UPDATE compression_algorithms 
      SET status = 'DELETED' 
      WHERE id = $1;
    `;
    return await this.dataSource.query(query, [id]);
  }

  // Для проверки недоступности удаленной карточки (404)
  async getAlgorithmById(id: string) {
    const algo = await this.algoRepo.findOne({
      where: { id: id as any },
    });

    if (!algo || algo.status === AlgorithmStatus.DELETED) {
      throw new NotFoundException('Услуга удалена или не существует');
    }
    return algo;
  }
}