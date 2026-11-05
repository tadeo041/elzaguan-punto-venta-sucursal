import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { Tip } from '../tips/tip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tip])],
  controllers: [MetricsController],
  providers: [MetricsService]
})
export class MetricsModule {}