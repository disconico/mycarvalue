import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  create(email: string, password: string) {
    const user = this.repo.create({ email, password });

    return this.repo.save(user);
  }

  async findOne(id: number) {
    if (!id) return null;

    try {
      const user = await this.repo.findOneByOrFail({ id });
      return user;
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async findOneByEmail(email: string) {
    try {
      const user = await this.repo.findOneByOrFail({ email });
      return user;
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  find(email: string) {
    return this.repo.find({
      where: { email },
    });
  }

  async update(id: number, attrs: Partial<User>) {
    try {
      const user = await this.repo.findOneByOrFail({ id });
      Object.assign(user, attrs);
      return this.repo.save(user);
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async remove(id: number) {
    try {
      const user = await this.repo.findOneByOrFail({ id });
      return this.repo.remove(user);
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async isEmailInUse(email: string) {
    const count = await this.repo.count({ where: { email } });

    return count >= 1;
  }
}
