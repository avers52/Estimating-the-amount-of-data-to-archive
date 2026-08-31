import { Injectable } from '@nestjs/common';
import { CompressionAlgorithm, AlgorithmStatus } from './compression-algorithm.entity.js';

@Injectable()
export class CompressionAlgorithmsService {
  private readonly minioBaseUrl = 'http://localhost:9000/compression-algorithms-media';

  private algorithms: CompressionAlgorithm[] = [
    {
      algorithm_id: 1,
      algorithm_name: 'Zstandard (zstd)',
      algorithm_description: 'Высокоэффективный алгоритм реального времени с отличным коэффициентом сжатия.',
      compression_ratio: 3.8,
      compression_speed_mbps: 480,
      decompression_speed_mbps: 1350,
      ram_usage_mb: 64,
      image_key: 'zstd_archiver.png',
      video_key: 'zstd_benchmark.mp4',
      algorithm_status: AlgorithmStatus.PUBLISHED,
      liked_engineer_ids: [101, 102, 108, 115],
    },
    {
      algorithm_id: 2,
      algorithm_name: 'Brotli Stream',
      algorithm_description: 'Оптимизирован для сжатия веб-контента и текстовых дампов баз данных.',
      compression_ratio: 4.2,
      compression_speed_mbps: 210,
      decompression_speed_mbps: 800,
      ram_usage_mb: 128,
      image_key: 'brotli_web.png',
      video_key: 'brotli_test.mp4',
      algorithm_status: AlgorithmStatus.PUBLISHED,
      liked_engineer_ids: [101, 105],
    },
    {
      algorithm_id: 3,
      algorithm_name: 'LZ4 Fast',
      algorithm_description: 'Экстремально быстрый алгоритм для потокового сжатия на лету.',
      compression_ratio: 2.1,
      compression_speed_mbps: 780,
      decompression_speed_mbps: 2900,
      ram_usage_mb: 16,
      image_key: 'lz4_stream.png',
      video_key: 'lz4_speed.mp4',
      algorithm_status: AlgorithmStatus.PUBLISHED,
      liked_engineer_ids: [102, 103, 104, 109, 111],
    },
    {
      algorithm_id: 4,
      algorithm_name: 'Snappy Raw',
      algorithm_description: 'Алгоритм, нацеленный на максимальную производительность процессора.',
      compression_ratio: 1.9,
      compression_speed_mbps: 650,
      decompression_speed_mbps: 2100,
      ram_usage_mb: 32,
      image_key: 'snappy_raw.png',
      video_key: 'snappy_demo.mp4',
      algorithm_status: AlgorithmStatus.PUBLISHED,
      liked_engineer_ids: [105],
    },
    {
      algorithm_id: 5,
      algorithm_name: 'Gzip Extended Draft',
      algorithm_description: 'Черновой профиль настройки сжатия с кастомным словарем.',
      compression_ratio: 2.9,
      compression_speed_mbps: 180,
      decompression_speed_mbps: 420,
      ram_usage_mb: 48,
      image_key: 'gzip_draft.png',
      video_key: 'gzip_process.mp4',
      algorithm_status: AlgorithmStatus.DRAFT,
      liked_engineer_ids: [],
    },
    {
      algorithm_id: 6,
      algorithm_name: 'Legacy Compress Deprecated',
      algorithm_description: 'Устаревший алгоритм, исключенный из использования.',
      compression_ratio: 1.2,
      compression_speed_mbps: 50,
      decompression_speed_mbps: 80,
      ram_usage_mb: 8,
      image_key: 'legacy.png',
      video_key: 'legacy.mp4',
      algorithm_status: AlgorithmStatus.DELETED,
      liked_engineer_ids: [],
    },
  ];

  private enrichMediaUrls(item: CompressionAlgorithm) {
    return {
      ...item,
      image_url: `${this.minioBaseUrl}/${item.image_key}`,
      video_url: `${this.minioBaseUrl}/${item.video_key}`,
      likes_count: item.liked_engineer_ids.length,
    };
  }

  getPublishedAlgorithms(minRatio?: number) {
    let list = this.algorithms.filter(a => a.algorithm_status === AlgorithmStatus.PUBLISHED);
    if (minRatio !== undefined && !isNaN(minRatio)) {
      list = list.filter(a => a.compression_ratio >= minRatio);
    }
    return list.map(a => this.enrichMediaUrls(a));
  }

  getFeedAlgorithm(currentId?: number, getNext?: boolean) {
    const published = this.algorithms.filter(a => a.algorithm_status === AlgorithmStatus.PUBLISHED);
    if (!published.length) return null;

    if (!currentId) {
      return this.enrichMediaUrls(published[0]);
    }

    const currentIndex = published.findIndex(a => a.algorithm_id === currentId);
    if (currentIndex === -1) {
      return this.enrichMediaUrls(published[0]);
    }

    if (getNext) {
      const nextIndex = (currentIndex + 1) % published.length;
      return this.enrichMediaUrls(published[nextIndex]);
    }

    return this.enrichMediaUrls(published[currentIndex]);
  }

  getDraftAlgorithm() {
    const draft = this.algorithms.find(a => a.algorithm_status === AlgorithmStatus.DRAFT);
    return draft ? this.enrichMediaUrls(draft) : null;
  }
}