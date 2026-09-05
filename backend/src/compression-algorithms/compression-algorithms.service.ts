import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  CompressionAlgorithm,
  AlgorithmStatus,
} from './entities/compression-algorithm.entity';

@Injectable()
export class CompressionAlgorithmsService {
  constructor(
    @InjectRepository(CompressionAlgorithm)
    private readonly algoRepo: Repository<CompressionAlgorithm>,
    private readonly dataSource: DataSource,
  ) {}

  // 1. GET FEED (ORM)
  async getFeed(algorithmId?: string) {
    let query = this.algoRepo
      .createQueryBuilder('algo')
      .leftJoinAndSelect('algo.likes', 'likes')
      .where('algo.status = :status', { status: AlgorithmStatus.PUBLISHED });

    if (algorithmId) {
      query = query.andWhere('algo.id = :id', { id: algorithmId });
    }

    const item = await query.getOne();
    if (!item) return null;

    return {
      ...item,
      likes_count: item.likes ? item.likes.length : 0,
    };
  }

  // 2. GET CATALOG (ORM)
  async getCatalog(minRatio?: number) {
    let query = this.algoRepo
      .createQueryBuilder('algo')
      .leftJoinAndSelect('algo.likes', 'likes')
      .where('algo.status = :status', { status: AlgorithmStatus.PUBLISHED });

    if (minRatio !== undefined && !isNaN(minRatio)) {
      query = query.andWhere('algo.compression_ratio >= :minRatio', {
        minRatio,
      });
    }

    const items = await query.getMany();
    return items.map((algo) => ({
      ...algo,
      likes_count: algo.likes ? algo.likes.length : 0,
    }));
  }

  // 3. GET DRAFT (ORM)
  async getUserDraft(userId: string = '1') {
    return await this.algoRepo.findOne({
      where: {
        creator_id: userId,
        status: AlgorithmStatus.DRAFT,
      },
    });
  }

  // 4. POST CREATE (Шаг 1: кнопка "Далее", ORM)
  async createDraft(
    name: string,
    imageUrl: string,
    videoUrl: string,
    userId: string = '1',
  ) {
    const draft = this.algoRepo.create({
      name,
      image_url: imageUrl,
      video_url: videoUrl,
      creator_id: userId,
      status: AlgorithmStatus.DRAFT,
    });
    return await this.algoRepo.save(draft);
  }

  // 5. POST PUBLISH (Шаг 2: кнопка "Опубликовать", ORM)
  async publishDraft(
    id: string,
    description: string,
    ratio: number,
    speed: number,
  ) {
    const draft = await this.algoRepo.findOneBy({
      id,
      status: AlgorithmStatus.DRAFT,
    });
    if (!draft) {
      throw new NotFoundException('Черновик не найден');
    }

    draft.description = description;
    draft.compression_ratio = ratio;
    draft.compression_speed_mbps = speed;
    draft.status = AlgorithmStatus.PUBLISHED;
    draft.formed_at = new Date();

    return await this.algoRepo.save(draft);
  }

  // 6. POST DELETE (Кнопка удаления, СТРОГО через SQL UPDATE без ORM)
  async deleteAlgorithmRawSql(id: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE compression_algorithms SET status = 'DELETED' WHERE id = $1`,
      [id],
    );
  }

  // Просмотр по прямому переходу по URL
  async getAlgorithmById(id: string) {
    const algo = await this.algoRepo.findOneBy({ id });
    if (!algo || algo.status === AlgorithmStatus.DELETED) {
      throw new NotFoundException('Алгоритм удален или не существует');
    }
    return algo;
  }
}