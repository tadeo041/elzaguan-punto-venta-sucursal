import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // Al usar PartialType, hereda todos los campos de CreateUserDto 
  // pero los vuelve opcionales automáticamente.
}