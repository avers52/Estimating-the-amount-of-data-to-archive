import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

@Entity('algorithm_likes')
@Unique(['user_id', 'algorithm_id'])
export class AlgorithmLike {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  user_id: string;

  @Column({ type: 'bigint' })
  algorithm_id: string;

  @ManyToOne('User', 'likes', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: any;

  @ManyToOne('CompressionAlgorithm', 'likes', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'algorithm_id' })
  algorithm: any;
}