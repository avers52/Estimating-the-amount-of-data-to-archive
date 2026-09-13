import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { CompressionAlgorithm } from '../../compression-algorithms/entities/compression-algorithm.entity';
import { AlgorithmLike } from '../../compression-algorithms/entities/algorithm-like.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'full_name', type: 'varchar', length: 120, nullable: true })
  name: string;

  @Column({ name: 'email', type: 'varchar', length: 120, unique: true })
  email: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @OneToMany(() => CompressionAlgorithm, (algo) => algo.creator)
  algorithms: CompressionAlgorithm[];

  @OneToMany(() => AlgorithmLike, (like) => like.user)
  likes: AlgorithmLike[];
}
