import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  Delete,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserClientDto } from './dtos/user-client.dto';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { QueryFailedError } from 'typeorm';

@Controller('auth')
@Serialize(UserClientDto)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Post('/signup')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() body: CreateUserDto) {
    try {
      return this.authService.signup(body.email, body.password);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.message.includes('UNIQUE constraint failed')
      ) {
        throw new BadRequestException('Email is allready in use');
      }
      throw error;
    }
  }

  @Get('/:id')
  findUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Get()
  findAllUsers(@Query('email') email: string) {
    return this.usersService.find(email);
  }

  @Patch('/:id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.update(id, body);
  }

  @Delete('/:id')
  removeUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
