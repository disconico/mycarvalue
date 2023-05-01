import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify<string, string, number, Buffer>(_scrypt);

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  const validEmail = 'test@test.com';
  const validPassword = 'validpassword';
  const invalidPassword = 'invalidpassword';
  const emailInUse = 'test@test.com';
  const hashedPassword = 'hashed-password';

  beforeEach(async () => {
    const users: User[] = [];

    // Create a fake copy of the usersService
    fakeUsersService = {
      findOneByEmail: (email: string) => {
        const user = users.find((user) => user.email === email);
        return Promise.resolve(user || null);
      },
      create: (email: string, password: string) => {
        const newUser = new User();
        newUser.id = Math.floor(Math.random() * 10000);
        newUser.email = email;
        newUser.password = password;
        users.push(newUser);
        return Promise.resolve(newUser);
      },
      isEmailInUse: (email: string) => {
        const emailInUse = users.some((user) => user.email === email);
        return Promise.resolve(emailInUse);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: fakeUsersService },
      ],
    }).compile();

    service = module.get(AuthService);

    // Create a user with a valid email and hashed password
    const newUser = new User();
    newUser.id = Math.floor(Math.random() * 10000);
    newUser.email = validEmail;

    // Generate a salt and hash the password
    const salt = randomBytes(12).toString('hex');
    const hash = (await scrypt(validPassword, salt, 32)).toString('hex');
    newUser.password = salt + '.' + hash;

    users.push(newUser);
  });

  it('can create an instance of auth service', () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const plainPassword = 'test123';
    const user = await service.signup('newusertest@test.com', plainPassword);

    expect(user.password).not.toEqual(plainPassword);
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();

    // Check if the password has been hashed correctly
    const expectedHash = (await scrypt(plainPassword, salt, 32)).toString(
      'hex',
    );
    expect(hash).toEqual(expectedHash);
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await expect(service.signup(emailInUse, 'test123')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws an error if signin is called with an unused email', async () => {
    await expect(
      service.signin('notused@email.com', 'test123'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws an error if invalid password is provided', async () => {
    // Expect a BadRequestException when an invalid password is provided
    await expect(service.signin(validEmail, invalidPassword)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns a user if correct password is provided', async () => {
    // Expect to return a user when valid password is provided
    await expect(
      service.signin(validEmail, validPassword),
    ).resolves.toBeInstanceOf(User);
  });
});
