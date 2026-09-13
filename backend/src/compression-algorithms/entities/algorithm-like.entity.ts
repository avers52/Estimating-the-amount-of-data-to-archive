import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CompressionAlgorithm } from './compression-algorithm.entity';

@Entity('algorithm_likes')
@Unique(['user_id', 'algorithm_id'])
export class AlgorithmLike {
  @PrimaryGeneratedColumn('increment', { name: 'like_id', type: 'bigint' })
  like_id: string;

  @Column({ name: 'user_id', type: 'bigint' })
  user_id: string;

  @Column({ name: 'algorithm_id', type: 'bigint' })
  algorithm_id: string;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => CompressionAlgorithm, (algo) => algo.likes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'algorithm_id' })
  algorithm: CompressionAlgorithm;
}
