export interface AlgorithmResponseDto {
  algorithm_id: number;
  algorithm_name: string;
  algorithm_description: string;
  image_url: string;
  video_url: string;
  compression_ratio: number;
  compression_speed_mbps: number;
  is_creator: number;
  likes_count: number;
  is_liked: number;
}

export function toAlgorithmDto(
  algo: any,
  currentUserId: number,
  likesCount: number = 0,
  isLiked: boolean = false,
): AlgorithmResponseDto {
  return {
    algorithm_id: Number(algo.algorithm_id) || 0,
    algorithm_name: algo.algorithm_name ?? '',
    algorithm_description: algo.algorithm_description ?? '',
    image_url: algo.image_url ?? '',
    video_url: algo.video_url ?? '',
    compression_ratio: algo.compression_ratio !== null ? parseFloat(algo.compression_ratio) : 0,
    compression_speed_mbps: algo.compression_speed_mbps !== null ? Number(algo.compression_speed_mbps) : 0,
    is_creator: Number(algo.creator_id) === currentUserId ? 1 : 0,
    likes_count: likesCount,
    is_liked: isLiked ? 1 : 0,
  };
}
