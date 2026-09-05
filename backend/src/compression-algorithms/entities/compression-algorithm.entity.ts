import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

export enum AlgorithmStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DELETED = 'DELETED',
}

@Entity('compression_algorithms')
export class CompressionAlgorithm {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20, default: AlgorithmStatus.DRAFT })
  status: AlgorithmStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  video_url: string;

  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true })
  compression_ratio: number;

  @Column({ type: 'numeric', precision: 8, scale: 2, nullable: true })
  compression_speed_mbps: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  formed_at: Date;

  @Column({ type: 'bigint', nullable: false })
  creator_id: string;

  @ManyToOne('User', 'algorithms', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creator_id' })
  creator: any;

  @OneToMany('AlgorithmLike', 'algorithm')
  likes: any[];
}