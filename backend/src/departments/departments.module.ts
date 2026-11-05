import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { Department } from './department.entity';
import { Tip } from '../tips/tip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Department, Tip]),],
  controllers: [DepartmentsController],
  providers: [DepartmentsService]
})
export class DepartmentsModule {}