import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CompressionAlgorithm } from './compression-algorithm.entity';

@Entity('algorithm_likes')
export class AlgorithmLike {
  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  user_id: string;

  @PrimaryColumn({ name: 'algorithm_id', type: 'bigint' })
  algorithm_id: string;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => CompressionAlgorithm, (algo) => algo.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'algorithm_id' })
  algorithm: CompressionAlgorithm;
}
