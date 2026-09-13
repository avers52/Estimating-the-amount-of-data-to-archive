import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThanOrEqual } from 'typeorm';
import { CompressionAlgorithm, AlgorithmStatus } from './entities/compression-algorithm.entity';
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
          algorithm_id: parseInt(currentId, 10),
          algorithm_status: AlgorithmStatus.PUBLISHED,
        },
      });
    }

    if (!algorithm) {
      algorithm = await this.algoRepo.findOne({
        where: { algorithm_status: AlgorithmStatus.PUBLISHED },
        order: { algorithm_id: 'ASC' },
      });
    }

    if (!algorithm) return null;

    const nextAlgo = await this.algoRepo
      .createQueryBuilder('algo')
      .where('algo.algorithm_status = :status', { status: AlgorithmStatus.PUBLISHED })
      .andWhere('algo.algorithm_id > :currentId', { currentId: algorithm.algorithm_id })
      .orderBy('algo.algorithm_id', 'ASC')
      .getOne();

    const firstAlgo = await this.algoRepo.findOne({
      where: { algorithm_status: AlgorithmStatus.PUBLISHED },
      order: { algorithm_id: 'ASC' },
    });

    const nextId = nextAlgo
      ? nextAlgo.algorithm_id
      : firstAlgo
      ? firstAlgo.algorithm_id
      : algorithm.algorithm_id;

    const likesCount = await this.likeRepo.count({
      where: { algorithm_id: String(algorithm.algorithm_id) as any },
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
      algorithm_status: AlgorithmStatus.PUBLISHED,
    };

    if (minRatio !== undefined && !isNaN(minRatio)) {
      whereCondition.compression_ratio = MoreThanOrEqual(minRatio);
    }

    const algorithms = await this.algoRepo.find({
      where: whereCondition,
      order: { algorithm_id: 'ASC' },
    });

    return Promise.all(
      algorithms.map(async (algo) => {
        const likesCount = await this.likeRepo.count({
          where: { algorithm_id: String(algo.algorithm_id) as any },
        });
        return {
          ...algo,
          likes_count: likesCount,
        };
      }),
    );
  }

  // 3. GET DRAFT (ORM)
  async getUserDraft(userId: string | number = '1') {
    return await this.algoRepo.findOne({
      where: {
        creator_id: Number(userId),
        algorithm_status: AlgorithmStatus.DRAFT,
      },
    });
  }

  // 4. POST DRAFT CREATE (ORM)
  async createDraft(name: string, userId: string | number = '1') {
    const numericUserId = Number(userId);
    const existingDraft = await this.getUserDraft(numericUserId);

    if (existingDraft) {
      existingDraft.algorithm_name = name;
      return await this.algoRepo.save(existingDraft);
    }

    const draft = this.algoRepo.create({
      algorithm_name: name,
      creator_id: numericUserId,
      algorithm_status: AlgorithmStatus.DRAFT,
    });
    return await this.algoRepo.save(draft);
  }

  // 5. POST DRAFT PUBLISH (ORM)
  async publishDraft(
    id: string,
    description: string,
    compressionRatio: number,
    compressionSpeedMbps: number,
    imageUrl?: string,
    videoUrl?: string,
  ) {
    const draft = await this.algoRepo.findOne({
      where: {
        algorithm_id: parseInt(id, 10),
        algorithm_status: AlgorithmStatus.DRAFT,
      },
    });

    if (!draft) {throw new NotFoundException('Черновик не найден');
    }

    draft.algorithm_description = description;
    draft.compression_ratio = compressionRatio;
    draft.compression_speed_mbps = compressionSpeedMbps;
    if (imageUrl) draft.image_url = imageUrl;
    if (videoUrl) draft.video_url = videoUrl;
    draft.algorithm_status = AlgorithmStatus.PUBLISHED;
    draft.configured_at = new Date();

    return await this.algoRepo.save(draft);
  }

  // 6. POST CATALOG DELETE (Чистый SQL UPDATE без ORM)
  async deleteAlgorithmRawSql(id: string) {
    const query = `
      UPDATE compression_algorithms 
      SET algorithm_status = 'deleted' 
      WHERE algorithm_id = $1;
    `;
    return await this.dataSource.query(query, [parseInt(id, 10)]);
  }

  // Прямое обращение по ID (404 для удаленных)
  async getAlgorithmById(id: string) {
    const algo = await this.algoRepo.findOne({
      where: { algorithm_id: parseInt(id, 10) },
    });

    if (!algo || algo.algorithm_status === AlgorithmStatus.DELETED) {
      throw new NotFoundException('Услуга удалена или не существует');
    }
    return algo;
  }
}