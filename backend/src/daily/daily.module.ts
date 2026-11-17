import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyService } from './daily.service';
import { DailyController } from './daily.controller';
import { DailyConfig } from './daily-config.entity';
import { Tip } from '../tips/tip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DailyConfig, Tip])],
  controllers: [DailyController],
  providers: [DailyService],
  exports: [DailyService],
})
export class DailyModule {}