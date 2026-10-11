import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CompressionAlgorithm } from './compression-algorithm.entity';

@Entity('algorithm_likes')
@Unique(['user_id', 'algorithm_id'])
export class AlgorithmLike {
  @PrimaryGeneratedColumn('increment', { name: 'like_id', type: 'int' })
  like_id: number;

  @Column({ name: 'user_id', type: 'int' })
  user_id: number;

  @Column({ name: 'algorithm_id', type: 'int' })
  algorithm_id: number;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => CompressionAlgorithm, (algo) => algo.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'algorithm_id' })
  algorithm: CompressionAlgorithm;
}