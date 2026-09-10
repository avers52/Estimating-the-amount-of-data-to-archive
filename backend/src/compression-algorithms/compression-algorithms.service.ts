import { Injectable } from '@nestjs/common';
import { CompressionAlgorithm, AlgorithmStatus } from './compression-algorithm.entity.js';

@Injectable()
export class CompressionAlgorithmsService {
  private readonly minioBaseUrl = 'http://localhost:9000/compression-algorithms-media';

    private algorithms: CompressionAlgorithm[] = [
      {
        algorithm_id: 1,
        algorithm_name: 'Zstandard (zstd)',
        algorithm_description:
          'Современный быстрый алгоритм сжатия без потерь от Meta, сочетающий степень сжатия уровня DEFLATE с впечатляющей скоростью распаковки на уровне нескольких гигабайт в секунду. Отлично масштабируется по уровням от 1 до 22.',
        compression_ratio: 3.2,
        compression_speed_mbps: 450,
        decompression_speed_mbps: 1200,
        ram_usage_mb: 32,
        image_key: 'zstd_archiver.png',
        video_key: 'zstd_benchmark.mp4',
        algorithm_status: AlgorithmStatus.PUBLISHED,
        liked_engineer_ids: [101, 102, 108, 115],
      },
      {
        algorithm_id: 2,
        algorithm_name: 'LZ4 Fast Compressor',
        algorithm_description:
          'Экстремально быстрый алгоритм сжатия без потерь, оптимизированный под предельную скорость обработки байтовых потоков до сотен мегабайт в секунду на одно ядро. Применяется для непрерывного потокового сжатия оперативной памяти, файловых систем ZFS, а также для временных очередей сообщений и кешей.',
        compression_ratio: 2.1,
        compression_speed_mbps: 780,
        decompression_speed_mbps: 3400,
        ram_usage_mb: 8,
        image_key: 'lz4_stream.png',
        video_key: 'lz4_speed.mp4',
        algorithm_status: AlgorithmStatus.PUBLISHED,
        liked_engineer_ids: [101, 104, 107],
      },
      {
        algorithm_id: 3,
        algorithm_name: 'Brotli High-Density',
        algorithm_description:
          'Специализированный алгоритм сжатия данных общего назначения от Google, применяющий контекстное моделирование второго порядка и встроенный предопределенный словарь частых текстовых паттернов.',
        compression_ratio: 4.1,
        compression_speed_mbps: 90,
        decompression_speed_mbps: 410,
        ram_usage_mb: 64,
        image_key: 'brotli_web.png',
        video_key: 'brotli_test.mp4',
        algorithm_status: AlgorithmStatus.PUBLISHED,
        liked_engineer_ids: [102, 105, 109, 112, 118],
      },
      {
        algorithm_id: 4,
        algorithm_name: 'Snappy Stream Encoder',
        algorithm_description:
          'Алгоритм сжатия от Google, ориентированный на предсказуемо высокую производительность и стабильную загрузку процессора без попыток достичь максимальной степени сжатия.',
        compression_ratio: 1.8,
        compression_speed_mbps: 620,
        decompression_speed_mbps: 2100,
        ram_usage_mb: 16,
        image_key: 'snappy_raw.png',
        video_key: 'snappy_demo.mp4',
        algorithm_status: AlgorithmStatus.PUBLISHED, 
        liked_engineer_ids: [103, 110, 114],
      },
      {
        algorithm_id: 5,
        algorithm_name: 'GZIP Legacy Archiver',
        algorithm_description:
          'Классический утилитный алгоритм сжатия на базе алгоритма DEFLATE (LZ77 и код Хаффмана). Является отраслевым стандартом сжатия данных в UNIX-подобных системах и сетевом протоколе HTTP. ',
        compression_ratio: 2.7,
        compression_speed_mbps: 110,
        decompression_speed_mbps: 380,
        ram_usage_mb: 12,
        image_key: 'gzip_draft.png',
        video_key: 'gzip_process.mp4',
        algorithm_status: AlgorithmStatus.DRAFT, 
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