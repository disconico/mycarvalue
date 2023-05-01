import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify<string, string, number, Buffer>(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    // See if email is in use
    const isEmailInUse = await this.usersService.isEmailInUse(email);
    if (isEmailInUse) {
      throw new BadRequestException('email is already in use');
    }
    // Hash password
    const salt = randomBytes(12).toString('hex');
    const hash = (await scrypt(password, salt, 32)).toString('hex'); // Convert the hash to a hex string
    const result = salt + '.' + hash;
    // Create a new user and save it
    // Return the user

    const user = await this.usersService.create(email, result);
    return user;
  }

  async signin(email: string, password: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [salt, storedHash] = user.password.split('.');

    const hash = await scrypt(password, salt, 32);

    if (storedHash !== hash.toString('hex')) {
      throw new BadRequestException('bad password');
    }

    return user;
  }
}
