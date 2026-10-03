import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AlgorithmLike } from './algorithm-like.entity';

export enum AlgorithmStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  DELETED = 'deleted',
}

@Entity('compression_algorithms')
export class CompressionAlgorithm {
  @PrimaryGeneratedColumn('increment', { name: 'algorithm_id', type: 'int' })
  algorithm_id: number;

  @Column({ name: 'algorithm_name', type: 'varchar', length: 100 })
  algorithm_name: string;

  @Column({ name: 'algorithm_description', type: 'text', nullable: true })
  algorithm_description: string;

  @Column({ name: 'algorithm_status', type: 'varchar', length: 20, default: AlgorithmStatus.DRAFT })
  algorithm_status: string;

  @Column({ name: 'image_url', type: 'varchar', length: 255, nullable: true })
  image_url: string;

  @Column({ name: 'video_url', type: 'varchar', length: 255, nullable: true })
  video_url: string;

  @Column({ name: 'compression_ratio', type: 'numeric', precision: 4, scale: 2, nullable: true })
  compression_ratio: number;

  @Column({ name: 'compression_speed_mbps', type: 'int', nullable: true })
  compression_speed_mbps: number;

  @Column({ name: 'creator_id', type: 'int' })
  creator_id: number;

  @ManyToOne(() => User, (u) => u.algorithms, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @OneToMany(() => AlgorithmLike, (like) => like.algorithm)
  likes: AlgorithmLike[];
}


