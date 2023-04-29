import { Expose } from 'class-transformer';

export class UserClientDto {
  @Expose()
  id: number;

  @Expose()
  email: string;
}
