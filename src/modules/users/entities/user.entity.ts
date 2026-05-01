import { Blog } from 'src/modules/blogs/entities/blog.entity';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'text', nullable: true })
  hashedRefreshToken: string | null;

  @OneToMany(() => Blog, (b) => b.user)
  blogs: Blog[];

  @Column()
  picPath: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = crypto.randomUUID();
  }
}
