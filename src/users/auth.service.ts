import { BadRequestException, Injectable } from '@nestjs/common';
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
    const salt = randomBytes(8).toString('hex');
    const hash = await scrypt(password, salt, 32);
    const result = salt + '.' + hash;
    // Create a new user and save it
    // Return the user

    const user = await this.usersService.create(email, result);
    return user;
  }

  signin() {}
}
