import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipsService } from './tips.service';
import { TipsController } from './tips.controller';
import { Tip } from './tip.entity';
import { User } from '../users/user.entity';
import { TipHistory } from './tip-history.entity'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Tip, User, TipHistory]) 
  ],
  providers: [TipsService],
  controllers: [TipsController]
})
export class TipsModule {}