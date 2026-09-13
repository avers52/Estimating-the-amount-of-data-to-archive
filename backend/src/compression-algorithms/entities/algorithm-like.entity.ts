import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

@Entity('algorithm_likes')
@Unique(['engineer_id', 'algorithm_id'])
export class AlgorithmLike {
  @PrimaryGeneratedColumn('increment', { name: 'like_id', type: 'int' })
  like_id: number;

  @Column({ name: 'engineer_id', type: 'int' })
  engineer_id: number;

  @Column({ name: 'algorithm_id', type: 'int' })
  algorithm_id: number;

  @ManyToOne('User', 'likes', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'engineer_id' })
  user: any;

  @ManyToOne('CompressionAlgorithm', 'likes', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'algorithm_id' })
  algorithm: any;
}
