export enum AlgorithmStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  DELETED = 'deleted',
}

export interface CompressionAlgorithm {
  algorithm_id: number;
  algorithm_name: string;
  algorithm_description: string;
  compression_ratio: number;
  compression_speed_mbps: number;
  decompression_speed_mbps: number;
  ram_usage_mb: number;
  image_key: string;
  video_key: string;
  algorithm_status: AlgorithmStatus;
  liked_engineer_ids: number[];
}